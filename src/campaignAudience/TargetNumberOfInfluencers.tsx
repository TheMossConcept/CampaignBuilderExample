import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { NumberInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftTargetNumberOfInfluencersQuery,
  CampaignDraftTargetNumberOfInfluencersQueryVariables,
} from './__generated__/CampaignDraftTargetNumberOfInfluencersQuery';
import {
  UpdateCampaignDraftTargetNumberOfInfluencers,
  UpdateCampaignDraftTargetNumberOfInfluencersVariables,
} from './__generated__/UpdateCampaignDraftTargetNumberOfInfluencers';

const MUTATE_UPDATE_TARGET_NUMBER_OF_INFLUENCERS = gql`
  mutation UpdateCampaignDraftTargetNumberOfInfluencers($campaignDraftId: ID!, $targetNumberOfInfluencers: Int) {
    campaignDraftUpdateTargetNumberOfInfluencers(
      campaignDraftId: $campaignDraftId
      targetNumberOfInfluencers: $targetNumberOfInfluencers
    ) {
      id
      version
      targetNumberOfInfluencers {
        value
      }
    }
  }
`;

const QUERY_TARGET_NUMBER_OF_INFLUENCERS = gql`
  query CampaignDraftTargetNumberOfInfluencersQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      targetNumberOfInfluencers {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number };

const CampaignDraftTargetNumberOfInfluencers: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [targetNumberOfInfluencers, setTargetNumberOfInfluencers] = useState<number | undefined | null>();

  const { data, loading, error } = useBHQuery<
    CampaignDraftTargetNumberOfInfluencersQuery,
    CampaignDraftTargetNumberOfInfluencersQueryVariables
  >(QUERY_TARGET_NUMBER_OF_INFLUENCERS, {
    variables: { campaignDraftId },
  });
  const initialTargetNumberOfInfluencers = getProp(data)
    .on('campaignDraft')
    .onValue('targetNumberOfInfluencers')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(
    initialTargetNumberOfInfluencers,
    setTargetNumberOfInfluencers,
    loading,
    error,
  );

  const {
    valueForMutation: targetNumberOfInfluencersForMutation,
    setValueWithStateUpdates: setTargetNumberOfInfluencersWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [targetNumberOfInfluencers, setTargetNumberOfInfluencers],
    yupValidators.campaignDraft.targetNumberOfInfluencers,
    'influencer target',
    debounceValue,
  );

  const [updateMinimumFollowers] = useBHMutation<
    UpdateCampaignDraftTargetNumberOfInfluencers,
    UpdateCampaignDraftTargetNumberOfInfluencersVariables
  >(MUTATE_UPDATE_TARGET_NUMBER_OF_INFLUENCERS, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (targetNumberOfInfluencersForMutation) {
      updateMinimumFollowers({
        variables: { targetNumberOfInfluencers: targetNumberOfInfluencersForMutation, campaignDraftId },
      });
    }
  }, [campaignDraftId, targetNumberOfInfluencersForMutation, updateMinimumFollowers]);

  return (
    <NumberInput
      state={[targetNumberOfInfluencers || undefined, setTargetNumberOfInfluencersWithStateUpdates]}
      error={validationError}
      disabled={!hasBeenInitialized}
      fullWidth={true}
      label="Influencer target"
    />
  );
};

export default CampaignDraftTargetNumberOfInfluencers;
