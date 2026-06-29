export interface IModernEmployeeHubProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  userEmail: string;
  spHttpClient: any;
  siteUrl: string;
  lists: Record<string, string>;
  isSiteAdmin: boolean;
}
