import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { Button, Grid, Typography } from '@material-ui/core';
import { DateTime } from 'luxon';
import React, { Dispatch, FC, SetStateAction } from 'react';
import { useHistory } from 'react-router-dom';

import { useBHQuery } from '../../apollo/BHApolloProvider';
import { RouteNames } from '../../router/RouteNames';
import { CampaignContentQuery, CampaignContentQueryVariables } from './__generated__/CampaignContentQuery';
import ApproveCampaignDraftButton from './ApproveCampaignDraftButton';
import CampaignDraftCommentsComponent from './comments/CampaignDraftCommentsComponent';

const CAMPAIGN_CONTENT_QUERY = gql`
  query CampaignContentQuery($campaignId: ID!) {
    campaign(id: $campaignId) {
      id
      version
      name {
        value
      }
      draftMeta {
        value {
          id
          version
          draft {
            value {
              id
              version
              startDate {
                value
              }
            }
          }
        }
      }
    }
  }
`;

type Props = {
  currentStepState: [number, Dispatch<SetStateAction<number>>];
  campaignId: string;
  campaignIsValid: boolean;
  lastStep: boolean;
  disableButtons?: boolean;
};

const CampaignBuilderBottomBar: FC<Props> = ({
  currentStepState,
  campaignIsValid,
  lastStep,
  campaignId,
  disableButtons: buttonsShouldBeDisabled = false,
}) => {
  const { data } = useBHQuery<CampaignContentQuery, CampaignContentQueryVariables>(CAMPAIGN_CONTENT_QUERY, {
    variables: { campaignId },
  });

  const history = useHistory();

  const campaignVersion = getProp(data)
    .on('campaign')
    .on('version')
    .get();
  const campaignName = getProp(data)
    .on('campaign')
    .onValue('name')
    .get();

  const campaignDraftMetaId = getProp(data)
    .on('campaign')
    .onValue('draftMeta')
    .on('id')
    .get();

  const startDate = getProp(data)
    .on('campaign')
    .onValue('draftMeta')
    .onValue('draft')
    .onValue('startDate')
    .get();

  const [currentStep, setCurrentStep] = currentStepState;
  return (
    <>
      <Grid item={true}>
        <Button
          variant="contained"
          disabled={currentStep === 0 || buttonsShouldBeDisabled}
          onClick={() => setCurrentStep(previousStep => previousStep - 1)}
        >
          Previous
        </Button>
      </Grid>
      {lastStep ? (
        <Grid item={true}>
          {campaignVersion ? (
            <ApproveCampaignDraftButton
              disabled={!campaignIsValid || buttonsShouldBeDisabled}
              /* If the start date is after the current date, the campaign is not immediately set to active */
              onCompleted={() => {
                const redirectRoute =
                  DateTime.fromISO(startDate) > DateTime.local()
                    ? RouteNames.campaigns.pending
                    : RouteNames.campaigns.active.submissions;
                history.push(redirectRoute);
              }}
              campaignVersion={campaignVersion}
              campaignID={campaignId}
              campaignName={campaignName || ''}
            />
          ) : (
            <Typography color="error" variant="caption">
              Unable to approve campaign at the moment. Please try again later
            </Typography>
          )}
        </Grid>
      ) : (
        <Grid item={true}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setCurrentStep(previousStep => previousStep + 1)}
            disabled={buttonsShouldBeDisabled}
          >
            Next
          </Button>
        </Grid>
      )}
      {campaignDraftMetaId && (
        <Grid item={true} xs={12}>
          <CampaignDraftCommentsComponent
            campaignDraftMetaId={campaignDraftMetaId}
            getCommentsForCampaignDraftMetaId={campaignDraftMetaId}
            postCommentsForCampaignDraftMetaId={campaignDraftMetaId}
          />
        </Grid>
      )}
    </>
  );
};

export default CampaignBuilderBottomBar;
