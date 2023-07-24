import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { SwitchInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftShowInSubmissionAppFeedQuery,
  CampaignDraftShowInSubmissionAppFeedQueryVariables,
} from './__generated__/CampaignDraftShowInSubmissionAppFeedQuery';
import {
  UpdateCampaignDraftShowInSubmissionAppFeed,
  UpdateCampaignDraftShowInSubmissionAppFeedVariables,
} from './__generated__/UpdateCampaignDraftShowInSubmissionAppFeed';

const MUTATE_UPDATE_CAMPAIGN_DRAFT_SHOW_IN_SUBMISSION_APP_FEED = gql`
  mutation UpdateCampaignDraftShowInSubmissionAppFeed($campaignDraftId: ID!, $showInAppfeed: Boolean!) {
    campaignDraftUpdateShowInSubmissionAppFeed(
      campaignDraftId: $campaignDraftId
      showInSubmissionAppFeed: $showInAppfeed
    ) {
      id
      version
      showInSubmissionAppFeed {
        value
      }
    }
  }
`;

const QUERY_CAMPAIGN_DRAFT_SHOW_IN_SUBMISSION_APP_FEED = gql`
  query CampaignDraftShowInSubmissionAppFeedQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      showInSubmissionAppFeed {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number };

const CDraftShowInSubmissionAppFeed: FC<Props> = ({ campaignDraftId, debounceValue = 0 }) => {
  const [showInAppFeed, setShowInAppFeed] = useState<boolean | undefined>();

  const { data, loading, error } = useBHQuery<
    CampaignDraftShowInSubmissionAppFeedQuery,
    CampaignDraftShowInSubmissionAppFeedQueryVariables
  >(QUERY_CAMPAIGN_DRAFT_SHOW_IN_SUBMISSION_APP_FEED, {
    variables: { campaignDraftId },
  });
  const initialShowInAppFeed = getProp(data)
    .on('campaignDraft')
    .onValue('showInSubmissionAppFeed')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(initialShowInAppFeed, setShowInAppFeed, loading, error);

  const {
    valueForMutation: showInAppFeedForMutation,
    setValueWithStateUpdates: setShowInAppFeedWithStatusUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [showInAppFeed, setShowInAppFeed],
    yupValidators.campaignDraft.showInSubmissionAppFeed,
    'Show in app feed',
    debounceValue,
  );

  const [updateIsGlobal] = useBHMutation<
    UpdateCampaignDraftShowInSubmissionAppFeed,
    UpdateCampaignDraftShowInSubmissionAppFeedVariables
  >(MUTATE_UPDATE_CAMPAIGN_DRAFT_SHOW_IN_SUBMISSION_APP_FEED, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (isDefined(showInAppFeedForMutation)) {
      updateIsGlobal({
        variables: { showInAppfeed: showInAppFeedForMutation, campaignDraftId },
      });
    }
  }, [campaignDraftId, showInAppFeedForMutation, updateIsGlobal]);

  return (
    <SwitchInput
      state={[showInAppFeed || false, setShowInAppFeedWithStatusUpdates]}
      color="primary"
      error={validationError}
      disabled={!hasBeenInitialized}
      label="Show submissions in app feed"
    />
  );
};

export default CDraftShowInSubmissionAppFeed;
