import { gql } from '@apollo/client';
import { Button, ButtonProps, Grid, SnackbarContent, Typography } from '@material-ui/core';
import React, { FC } from 'react';

import { useBHSnackbar } from '../../hooks/snackbar';
import BHMutation from '../common/error-components/BHMutation';
import Loading from '../common/Loading';
import { ApproveCampaignDraft, ApproveCampaignDraftVariables } from './__generated__/ApproveCampaignDraft';

const MUTATION_CAMPAIGN_DRAFT_ACCEPT = gql`
  mutation ApproveCampaignDraft($campaignID: ID!, $campaignVersion: Int!) {
    campaignPublish(campaignId: $campaignID, campaignVersion: $campaignVersion) {
      id
      version
      audienceType {
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
            }
          }
        }
      }
    }
  }
`;

export interface IApproveCampaignDraftMutationProps {
  campaignID: string;
  campaignVersion: number;
  campaignName: string;
  onCompleted?: () => void;
  buttonText?: string;
}

type Props = IApproveCampaignDraftMutationProps & Omit<ButtonProps, 'variant' | 'color'>;

const ApproveCampaignDraftButton: FC<Props> = ({
  campaignID,
  campaignVersion,
  campaignName,
  onCompleted,
  buttonText,
  onClick,
  disabled,
  ...buttonProps
}) => {
  let snackbarId: string | number | null | undefined;
  const { enqueueSnackbar, closeSnackbar } = useBHSnackbar();
  return (
    <BHMutation<ApproveCampaignDraft, ApproveCampaignDraftVariables>
      variables={{ campaignVersion, campaignID }}
      mutation={MUTATION_CAMPAIGN_DRAFT_ACCEPT}
      onCompleted={() => {
        if (snackbarId) {
          closeSnackbar(snackbarId);
          enqueueSnackbar(`Successfully approved campaign: ${campaignName}`, {
            variant: 'success',
          });
        }
        onCompleted && onCompleted();
      }}
      onError={() => {
        if (snackbarId) {
          closeSnackbar(snackbarId);
        }
        enqueueSnackbar('A campaign approval has failed. Please try again on the campaign approval page', {
          variant: 'error',
        });
      }}
    >
      {(mutation, { loading }) => {
        const mutationWrapper = () => {
          snackbarId = enqueueSnackbar('', {
            persist: true,
            content: (key, _) => (
              <div>
                <ApproveWaitingSnackbar campaignName={campaignName} key={key} />
              </div>
            ),
          });
          mutation({
            refetchQueries: [
              'PendingCampaigns',
              'CampaignGroupsAndCampaignsForSelectorQuery',
              'DrawerMenuCompanyRouteCountsData',
              'DrawerMenuBHERouteCountsData',
              'QueryCampaignButtonGroupActions',
            ],
          });
        };

        return (
          <Button
            variant="contained"
            color={disabled ? 'default' : 'primary'}
            disabled={disabled}
            onClick={event => {
              onClick && onClick(event);
              mutationWrapper();
            }}
            {...buttonProps}
          >
            {loading && <Loading variant="button" />}
            {buttonText || 'Publish changes'}
          </Button>
        );
      }}
    </BHMutation>
  );
};

type ApproveWaitingSnackbarProps = {
  campaignName: string;
};

export const ApproveWaitingSnackbar: FC<ApproveWaitingSnackbarProps> = ({ campaignName }) => (
  <SnackbarContent
    aria-describedby="Loading-snackbar"
    color="primary"
    message={
      <Grid style={{ height: '100%', width: '100%' }} container direction="row">
        <Grid item xs={10}>
          <Typography color="inherit">Currently approving campaign draft {campaignName}</Typography>
        </Grid>
        <Grid xs={2} item>
          <Loading variant="circular" />
        </Grid>
      </Grid>
    }
  />
);

export default ApproveCampaignDraftButton;
