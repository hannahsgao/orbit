export declare function initComposio(apiKey: string): void;
export interface AuthConfig {
    id: string;
    toolkit: string;
    name?: string;
}
export interface ConnectedAccount {
    id: string;
    integrationId: string;
    clientUniqueUserId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}
export interface ConnectionRequest {
    connectionStatus: string;
    connectedAccountId: string;
    redirectUrl: string;
}
export declare function getOrCreateAuthConfig(toolkit: string): Promise<string>;
export declare function initiateConnection(userId: string, toolkit?: string): Promise<ConnectionRequest>;
export declare function getConnectedAccount(userId: string, toolkit?: string): Promise<ConnectedAccount | null>;
export declare function listConnectedAccounts(userId: string): Promise<ConnectedAccount[]>;
export declare function getConnectedAccountById(accountId: string): Promise<ConnectedAccount | null>;
export interface ToolExecutionRequest {
    connectedAccountId: string;
    entityId: string;
    appName: string;
    actionName: string;
    input: Record<string, any>;
}
export interface ToolExecutionResponse {
    data: any;
    successful: boolean;
    error?: string;
}
export declare function executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResponse>;
export declare function fetchGmailEmails(entityId: string, connectedAccountId: string, query?: string, maxResults?: number): Promise<any>;
//# sourceMappingURL=composio.d.ts.map