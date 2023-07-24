import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { Card, Grid, makeStyles, Step, StepButton, Stepper, Theme, Typography } from '@material-ui/core';
import { History } from 'history';
import { isEmpty } from 'lodash';
import queryString from 'query-string';
import React, { FC, useState } from 'react';

import { useBHQuery } from '../../apollo/BHApolloProvider';
import { RouteNames } from '../../router/RouteNames';
import { CurrentUserCompanyForCampaignCreation } from './__generated__/CurrentUserCompanyForCampaignCreation';
import CampaignAudience from './campaignAudience/CampaignAudience';
import CampaignBrief from './campaignBrief/CampaignBrief';
import CampaignBuilderBottomBar from './CampaignBuilderBottomBar';
import {
  CampaignBuilderFeedback,
  CampaignBuilderFeedbackContext,
  useCampaignBuilderFeedbackReducer,
} from './CampaignBuilderFeedback';
import {
  CampaignBuilderValidationContext,
  useCampaignBuilderValidationReducer,
  ValidationHelp,
} from './CampaignBuilderValidation';
import { CreateCampaignWithName } from './campaignName/CreateCampaignWithName';
import { UpdateCampaignKey } from './campaignName/UpdateCampaignKey';
import { UpdateCampaignName } from './campaignName/UpdateCampaignName';

export const QUERY_CURRENT_USER_COMPANY = gql`
  query CurrentUserCompanyForCampaignCreation {
    currentUser @client {
      id
      companyId
    }
  }
`;

const useStyles = makeStyles<Theme>(({ palette }) => ({
  fixedHeightSavingIndicator: {
    height: '19px',
  },
  campaignSteps: {
    paddingLeft: '32px',
    paddingRight: '32px',
  },
  helpIconContainer: {
    marginLeft: '5px',
  },
  campaignContent: {
    marginBottom: '33px',
  },
  campaignContentCard: {
    padding: '12px',
  },
  feedbackContainer: {
    position: 'sticky',
    right: '5px',
    paddingTop: '5px',
    bottom: '0px',
    zIndex: 1,
    background: palette.background.default,
  },
  loadingButtonContainer: {
    width: '33px',
    height: '33px',
  },
}));

export const StepIndexContext = React.createContext<number | null>(null);

type Props = { campaignId?: string; campaignDraftId?: string; history: History };

const CampaignBuilder: FC<Props> = ({ campaignId, campaignDraftId, history }) => {
  const steps = ['Select audience', 'Create influencer brief'];
  const [currentStep, setCurrentStep] = useState(Number(queryString.parse(history.location.search).step) - 1 || 0);

  const [feedbackState, feedbackDispatch] = useCampaignBuilderFeedbackReducer();
  const [validationState, validationDispatch] = useCampaignBuilderValidationReducer();

  const fieldValidityValues = Object.values(validationState.validityOfFields);

  const { data: currentlySelectedCompanyData } = useBHQuery<CurrentUserCompanyForCampaignCreation>(
    QUERY_CURRENT_USER_COMPANY,
  );
  const companyId = getProp(currentlySelectedCompanyData)
    .on('currentUser')
    .on('companyId')
    .get();

  const { feedbackContainer, campaignContent, campaignSteps, campaignContentCard, helpIconContainer } = useStyles();
  return !companyId ? (
    <Grid container={true}>
      <Grid item={true} xs={12}>
        <Typography variant="h5" align="center">
          Please select a company in the menu to the left before creating or editing campaigns
        </Typography>
      </Grid>
    </Grid>
  ) : (
    <>
      {campaignId && campaignDraftId ? (
        // Workaround to compensate for the 20px padding all around the container
        <Grid container={true} spacing={3} style={{ marginBottom: '-20px' }}>
          <CampaignBuilderFeedbackContext.Provider value={feedbackDispatch}>
            <CampaignBuilderValidationContext.Provider value={validationDispatch}>
              <Grid item={true} xs={12} sm={7}>
                <UpdateCampaignName campaignId={campaignId} />
              </Grid>
              <Grid item={true} xs={12} sm={5}>
                <UpdateCampaignKey campaignId={campaignId} />
              </Grid>
              <Grid item={true} xs={12} className={campaignContent}>
                <Grid container={true} spacing={3} justifyContent="space-between" alignItems="center">
                  <Grid item={true} xs={12}>
                    <Card>
                      <Stepper alternativeLabel={true} nonLinear={true} activeStep={currentStep}>
                        {steps.map((step, index) => {
                          const stepIsValid = fieldValidityValues.every(field =>
                            // If the field is not part of the step, it should not count in the validation, thus true.
                            field.belongsToStepWithIndex === index ? field.isValid : true,
                          );
                          return (
                            <Step key={step}>
                              <StepButton
                                completed={stepIsValid}
                                onClick={() => {
                                  setCurrentStep(index);
                                  history.replace({
                                    pathname: history.location.pathname,
                                    search: `?step=${index + 1}`,
                                  });
                                }}
                              >
                                {step}
                                {!stepIsValid && (
                                  <Grid container={true} alignItems="flex-start" justifyContent="center">
                                    <Grid item={true}>
                                      <Typography color="secondary">Steps required </Typography>
                                    </Grid>
                                    <Grid item={true} className={helpIconContainer}>
                                      <ValidationHelp validationState={validationState} forStep={index} />
                                    </Grid>
                                  </Grid>
                                )}
                              </StepButton>
                            </Step>
                          );
                        })}
                      </Stepper>
                    </Card>
                  </Grid>
                  <Grid item={true} xs={12}>
                    <Card className={campaignContentCard}>
                      {currentStep === 0 && (
                        <StepIndexContext.Provider value={0}>
                          <CampaignAudience
                            campaignId={campaignId}
                            campaignDraftId={campaignDraftId}
                            containerClass={campaignSteps}
                          />
                        </StepIndexContext.Provider>
                      )}
                      {currentStep === 1 && (
                        <StepIndexContext.Provider value={1}>
                          <CampaignBrief
                            campaignId={campaignId}
                            campaignDraftId={campaignDraftId}
                            containerClass={campaignSteps}
                          />
                        </StepIndexContext.Provider>
                      )}
                    </Card>
                  </Grid>
                  <CampaignBuilderBottomBar
                    campaignId={campaignId}
                    lastStep={currentStep === steps.length - 1}
                    // If the field is no longer registered, it should not count in the validation, thus true
                    campaignIsValid={fieldValidityValues.every(fieldValidity =>
                      fieldValidity ? fieldValidity.isValid : true,
                    )}
                    currentStepState={[currentStep, setCurrentStep]}
                    disableButtons={!isEmpty(feedbackState.mutationsInFlight)}
                  />
                </Grid>
              </Grid>
            </CampaignBuilderValidationContext.Provider>
          </CampaignBuilderFeedbackContext.Provider>
          <Grid item={true} xs={12} className={feedbackContainer}>
            <CampaignBuilderFeedback
              mutationsInFlight={feedbackState.mutationsInFlight}
              mutationsFailed={feedbackState.mutationsFailed}
              lastSavedTimestamp={feedbackState.lastSaveFinished}
            />
          </Grid>
        </Grid>
      ) : (
        <CreateCampaignWithName
          companyId={companyId}
          onCompletion={(campaignId, campaignDraftId) =>
            history.push(`${RouteNames.campaign.edit.root}/${campaignDraftId}/${campaignId}`)
          }
        />
      )}
    </>
  );
};

export default CampaignBuilder;
