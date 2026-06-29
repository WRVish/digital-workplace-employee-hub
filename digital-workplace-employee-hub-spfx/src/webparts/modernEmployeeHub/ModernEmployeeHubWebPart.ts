import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { PropertyFieldListPicker, PropertyFieldListPickerOrderBy } from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'ModernEmployeeHubWebPartStrings';
import ModernEmployeeHub from './components/ModernEmployeeHub';
import { IModernEmployeeHubProps } from './components/IModernEmployeeHubProps';

export interface IModernEmployeeHubWebPartProps {
  description: string;
  employeeMasterListId: string;
  incidentRequestsListId: string;
  leaveRequestsListId: string;
  companyHolidaysListId: string;
  companyEventsListId: string;
  expenseClaimsListId: string;
  travelRequestsListId: string;
  inventoryMasterListId: string;
  inventoryAssignmentsListId: string;
  userPreferencesListId: string;
}

export default class ModernEmployeeHubWebPart extends BaseClientSideWebPart<IModernEmployeeHubWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<IModernEmployeeHubProps> = React.createElement(
      ModernEmployeeHub,
      {
        description: this.properties.description,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        userEmail: this.context.pageContext.user.email,
        spHttpClient: this.context.spHttpClient,
        siteUrl: this.context.pageContext.web.absoluteUrl,
        isSiteAdmin: !!(this.context.pageContext as any).legacyPageContext?.isSiteAdmin,
        lists: {
          employeeMaster: this.properties.employeeMasterListId,
          incidentRequests: this.properties.incidentRequestsListId,
          leaveRequests: this.properties.leaveRequestsListId,
          companyHolidays: this.properties.companyHolidaysListId,
          companyEvents: this.properties.companyEventsListId,
          expenseClaims: this.properties.expenseClaimsListId,
          travelRequests: this.properties.travelRequestsListId,
          inventoryMaster: this.properties.inventoryMasterListId,
          inventoryAssignments: this.properties.inventoryAssignmentsListId,
          userPreferences: this.properties.userPreferencesListId
        }
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }



  private _getEnvironmentMessage(): Promise<string> {
    if (this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyFieldListPicker('employeeMasterListId', {
                  label: 'Select Employee Master List',
                  selectedList: this.properties.employeeMasterListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: 'employeeMasterListId'
                }),
                PropertyFieldListPicker('incidentRequestsListId', {
                  label: 'Select Incident Requests List',
                  selectedList: this.properties.incidentRequestsListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: 'incidentRequestsListId'
                }),
                PropertyFieldListPicker('leaveRequestsListId', {
                  label: 'Select Leave Requests List',
                  selectedList: this.properties.leaveRequestsListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: 'leaveRequestsListId'
                }),
                PropertyFieldListPicker('companyHolidaysListId', {
                  label: 'Select Company Holidays List',
                  selectedList: this.properties.companyHolidaysListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: 'companyHolidaysListId'
                }),
                PropertyFieldListPicker('companyEventsListId', {
                  label: 'Select Company Events List',
                  selectedList: this.properties.companyEventsListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: 'companyEventsListId'
                }),
                PropertyFieldListPicker('expenseClaimsListId', {
                  label: 'Select Expense Claims List',
                  selectedList: this.properties.expenseClaimsListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: 'expenseClaimsListId'
                }),
                PropertyFieldListPicker('travelRequestsListId', {
                  label: 'Select Travel Requests List',
                  selectedList: this.properties.travelRequestsListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: 'travelRequestsListId'
                }),
                PropertyFieldListPicker('inventoryMasterListId', {
                  label: 'Select Inventory Master List',
                  selectedList: this.properties.inventoryMasterListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: 'inventoryMasterListId'
                }),
                PropertyFieldListPicker('inventoryAssignmentsListId', {
                  label: 'Select Inventory Assignments List',
                  selectedList: this.properties.inventoryAssignmentsListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: 'inventoryAssignmentsListId'
                }),
                PropertyFieldListPicker('userPreferencesListId', {
                  label: 'Select User Preferences List',
                  selectedList: this.properties.userPreferencesListId,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: 'userPreferencesListId'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
