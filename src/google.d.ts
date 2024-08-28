// google.d.ts
declare namespace google {
    namespace accounts {
        namespace oauth2 {
            interface TokenClient {
                callback?: (response: TokenResponse) => void;
                requestAccessToken(options?: {
                    prompt?: string;
                }): void;
            }

            interface TokenResponse {
                access_token: string;
                token_type: string;
                expires_in: number;
                scope: string;
            }

            function initTokenClient(options: {
                client_id: string;
                scope: string;
                callback: (response: TokenResponse) => void;
            }): TokenClient;
        }
    }
}
