import * as React from 'react';
import type { IModernEmployeeHubProps } from './IModernEmployeeHubProps';
import App from '../../../app-code/App';
import '../../../app-code/index.css';

import { DataService } from '../../../app-code/dataService';

export default class ModernEmployeeHub extends React.Component<IModernEmployeeHubProps> {
  constructor(props: IModernEmployeeHubProps) {
    super(props);
    DataService.init(props.spHttpClient, props.siteUrl, props.userEmail, props.lists, props.isSiteAdmin);
  }

  public render(): React.ReactElement<IModernEmployeeHubProps> {
    return (
      <App />
    );
  }
}
