import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { NumberInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftNumberOfPostsPerInfluencerQuery,
  CampaignDraftNumberOfPostsPerInfluencerQueryVariables,
} from './__generated__/CampaignDraftNumberOfPostsPerInfluencerQuery';
import {
  UpdateCampaignDraftPostsPerInfluecer,
  UpdateCampaignDraftPostsPerInfluecerVariables,
} from './__generated__/UpdateCampaignDraftPostsPerInfluecer';

const MUTATE_UPDATE_NUMBER_OF_POSTS_PER_INFLUENCER = gql`
  mutation UpdateCampaignDraftPostsPerInfluecer($campaignDraftId: ID!, $numberOfPostsPerInfluencer: Int) {
    campaignDraftUpdateNumberOfPostsPerInfluencer(
      campaignDraftId: $campaignDraftId
      numberOfPostsPerInfluencer: $numberOfPostsPerInfluencer
    ) {
      id
      version
      numberOfPostsPerInfluencer {
        value
      }
    }
  }
`;

const QUERY_NUMBER_OF_POSTS_PER_INFLUENCER = gql`
  query CampaignDraftNumberOfPostsPerInfluencerQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      numberOfPostsPerInfluencer {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number };

const CampaignDraftNumberOfPostsPerInfluencer: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [numberOfPostsPerInfluencer, setNumberOfPostsPerInfluencer] = useState<number | undefined | null>();

  const { data, loading, error } = useBHQuery<
    CampaignDraftNumberOfPostsPerInfluencerQuery,
    CampaignDraftNumberOfPostsPerInfluencerQueryVariables
  >(QUERY_NUMBER_OF_POSTS_PER_INFLUENCER, {
    variables: { campaignDraftId },
  });
  const initialNumberOfPostsPerInfluencer = getProp(data)
    .on('campaignDraft')
    .onValue('numberOfPostsPerInfluencer')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(
    initialNumberOfPostsPerInfluencer,
    setNumberOfPostsPerInfluencer,
    loading,
    error,
  );

  const {
    valueForMutation: numberOfPostsPerInfluencerForMutation,
    setValueWithStateUpdates: setNumberOfPostsPerInfluencerWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [numberOfPostsPerInfluencer, setNumberOfPostsPerInfluencer],
    yupValidators.campaignDraft.numberOfPostsPerInfluencer,
    'posts per influencer',
    debounceValue,
  );

  const [updateMinimumFollowers] = useBHMutation<
    UpdateCampaignDraftPostsPerInfluecer,
    UpdateCampaignDraftPostsPerInfluecerVariables
  >(MUTATE_UPDATE_NUMBER_OF_POSTS_PER_INFLUENCER, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (numberOfPostsPerInfluencerForMutation) {
      updateMinimumFollowers({
        variables: { numberOfPostsPerInfluencer: numberOfPostsPerInfluencerForMutation, campaignDraftId },
      });
    }
  }, [campaignDraftId, numberOfPostsPerInfluencerForMutation, updateMinimumFollowers]);

  return (
    <NumberInput
      state={[numberOfPostsPerInfluencer || undefined, setNumberOfPostsPerInfluencerWithStateUpdates]}
      error={validationError}
      disabled={!hasBeenInitialized}
      fullWidth={true}
      label="Posts per influencer"
    />
  );
};

export default CampaignDraftNumberOfPostsPerInfluencer;
