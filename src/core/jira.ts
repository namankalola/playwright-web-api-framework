import axios, { AxiosInstance, AxiosError } from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from './logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JIRA_URL = (process.env.JIRA_URL || '').replace(/\/+$/, '');
const JIRA_EMAIL = process.env.JIRA_EMAIL || '';
const JIRA_APIKEY = process.env.JIRA_APIKEY || '';

const authToken = Buffer.from(`${JIRA_EMAIL}:${JIRA_APIKEY}`).toString('base64');

const jiraClient: AxiosInstance = axios.create({
  baseURL: `${JIRA_URL}/rest/api/3`,
  headers: {
    Authorization: `Basic ${authToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export interface JiraIssueSummary {
  key: string;
  summary: string;
  description: string;
  labels: string[];
  status: string;
}

interface AdfNode {
  type: string;
  content?: AdfNode[];
  text?: string;
}

interface AdfDocument {
  type: 'doc';
  version: number;
  content: AdfNode[];
}

interface JiraIssueApiResponse {
  key: string;
  fields?: {
    summary?: string;
    description?: AdfDocument;
    labels?: string[];
    status?: { name?: string };
  };
}

interface JiraTransition {
  id: string;
  name: string;
}

function logApiCall(action: string, detail: string): void {
  Logger.info(`[jira] ${action}: ${detail}`);
}

function logApiError(action: string, error: unknown): void {
  const axiosError = error as AxiosError;
  if (axiosError.response) {
    Logger.error(
      `[jira] ${action} failed: status ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`,
    );
  } else if (axiosError.request) {
    Logger.error(`[jira] ${action} failed: no response received - ${axiosError.message}`);
  } else {
    Logger.error(`[jira] ${action} failed: ${(error as Error).message}`);
  }
}

/**
 * Recursively extracts plain text from an Atlassian Document Format (ADF) node tree.
 */
function adfToPlainText(node: AdfNode | AdfDocument | undefined | null): string {
  if (!node || !node.content) {
    return '';
  }

  const lines: string[] = [];

  for (const block of node.content) {
    lines.push(extractTextFromNode(block));
  }

  return lines.filter((line) => line.length > 0).join('\n\n');
}

function extractTextFromNode(node: AdfNode): string {
  if (node.type === 'text') {
    return node.text || '';
  }

  if (!node.content || node.content.length === 0) {
    return '';
  }

  return node.content.map(extractTextFromNode).join('');
}

/**
 * Wraps plain text in a minimal ADF paragraph node so it can be sent back to Jira.
 */
function textToAdfParagraph(text: string): AdfNode {
  return {
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

/**
 * Searches for all issues in the given project with status "To Do".
 */
export async function getToDoTasks(projectKey: string): Promise<JiraIssueSummary[]> {
  const jql = `project = "${projectKey}" AND status = "Ready For Automation"`;
  logApiCall('getToDoTasks', `searching project=${projectKey}`);

  try {
    const response = await jiraClient.post('/search/jql', {
      jql,
      fields: ['summary', 'description', 'labels', 'status'],
    });

    const issues: JiraIssueApiResponse[] = response.data.issues || [];
    logApiCall('getToDoTasks', `found ${issues.length} issue(s)`);

    return issues.map((issue) => ({
      key: issue.key,
      summary: issue.fields?.summary || '',
      description: adfToPlainText(issue.fields?.description),
      labels: issue.fields?.labels || [],
      status: issue.fields?.status?.name || '',
    }));
  } catch (error) {
    logApiError('getToDoTasks', error);
    return [];
  }
}

/**
 * Fetches a single issue and extracts its description as plain text from ADF.
 */
export async function getTaskDescription(issueKey: string): Promise<string> {
  logApiCall('getTaskDescription', `fetching ${issueKey}`);

  try {
    const response = await jiraClient.get(`/issue/${issueKey}`, {
      params: { fields: 'description' },
    });

    const description = adfToPlainText(response.data?.fields?.description);
    logApiCall('getTaskDescription', `retrieved description for ${issueKey}`);
    return description;
  } catch (error) {
    logApiError('getTaskDescription', error);
    return '';
  }
}

/**
 * Gets available transitions for the issue, finds the one matching transitionName,
 * and executes it.
 */
export async function moveTask(issueKey: string, transitionName: string): Promise<boolean> {
  logApiCall('moveTask', `fetching transitions for ${issueKey}`);

  try {
    const transitionsResponse = await jiraClient.get(`/issue/${issueKey}/transitions`);
    const transitions: JiraTransition[] = transitionsResponse.data?.transitions || [];

    const match = transitions.find(
      (t) => t.name.toLowerCase() === transitionName.toLowerCase(),
    );

    if (!match) {
      const available = transitions.map((t) => t.name).join(', ');
      Logger.error(
        `[jira] moveTask failed: transition "${transitionName}" not found for ${issueKey}. Available: ${available}`,
      );
      return false;
    }

    await jiraClient.post(`/issue/${issueKey}/transitions`, {
      transition: { id: match.id },
    });

    logApiCall('moveTask', `${issueKey} moved via transition "${match.name}"`);
    return true;
  } catch (error) {
    logApiError('moveTask', error);
    return false;
  }
}

/**
 * Fetches the current description, appends appendText as a new paragraph at the
 * bottom (preserving existing content), and puts it back.
 */
export async function updateDescription(issueKey: string, appendText: string): Promise<boolean> {
  logApiCall('updateDescription', `fetching current description for ${issueKey}`);

  try {
    const issueResponse = await jiraClient.get(`/issue/${issueKey}`, {
      params: { fields: 'description' },
    });

    const currentDescription: AdfDocument | null = issueResponse.data?.fields?.description || null;

    const updatedDoc: AdfDocument = currentDescription
      ? {
          type: 'doc',
          version: currentDescription.version || 1,
          content: [...currentDescription.content, textToAdfParagraph(appendText)],
        }
      : {
          type: 'doc',
          version: 1,
          content: [textToAdfParagraph(appendText)],
        };

    await jiraClient.put(`/issue/${issueKey}`, {
      fields: {
        description: updatedDoc,
      },
    });

    logApiCall('updateDescription', `appended text to ${issueKey}`);
    return true;
  } catch (error) {
    logApiError('updateDescription', error);
    return false;
  }
}
