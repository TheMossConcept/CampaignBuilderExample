import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { NumberInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftMinimumFollowersQuery,
  CampaignDraftMinimumFollowersQueryVariables,
} from './__generated__/CampaignDraftMinimumFollowersQuery';
import {
  UpdateCampaignDraftMinimumNumberOfFollowers,
  UpdateCampaignDraftMinimumNumberOfFollowersVariables,
} from './__generated__/UpdateCampaignDraftMinimumNumberOfFollowers';

const MUTATE_UPDATE_MINIMUM_NUMBER_OF_FOLLOWERS = gql`
  mutation UpdateCampaignDraftMinimumNumberOfFollowers($campaignDraftId: ID!, $minimumInstagramFollowers: Int) {
    campaignDraftUpdateMinimumInstagramFollowers(
      campaignDraftId: $campaignDraftId
      minimumInstagramFollowers: $minimumInstagramFollowers
    ) {
      id
      version
      minimumInstagramFollowers {
        value
      }
    }
  }
`;

const QUERY_MINIMUM_NUMBER_OF_FOLLOWERS = gql`
  query CampaignDraftMinimumFollowersQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      minimumInstagramFollowers {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number };

const CDraftMinimumNumberOfFollowers: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [minimumNumberOfFollowers, setMinimumNumberOfFollowers] = useState<number | undefined | null>();

  const { data, loading, error } = useBHQuery<
    CampaignDraftMinimumFollowersQuery,
    CampaignDraftMinimumFollowersQueryVariables
  >(QUERY_MINIMUM_NUMBER_OF_FOLLOWERS, {
    variables: { campaignDraftId },
  });
  const initialMinimumNumberOfFollowers = getProp(data)
    .on('campaignDraft')
    .onValue('minimumInstagramFollowers')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(
    initialMinimumNumberOfFollowers,
    setMinimumNumberOfFollowers,
    loading,
    error,
  );

  const {
    valueForMutation: minimumNumberOfFollowersForMutation,
    setValueWithStateUpdates: setMinimumNumberOfFollowersWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    // Since this is not required and nullable, interpret 0 (which is what NumberInput returns on an empty text field) as removing the value
    [minimumNumberOfFollowers === 0 ? null : minimumNumberOfFollowers, setMinimumNumberOfFollowers],
    yupValidators.campaignDraft.minimumInstagramFollowers,
    'minimum number of followers',
    debounceValue,
  );

  const [updateMinimumFollowers] = useBHMutation<
    UpdateCampaignDraftMinimumNumberOfFollowers,
    UpdateCampaignDraftMinimumNumberOfFollowersVariables
  >(MUTATE_UPDATE_MINIMUM_NUMBER_OF_FOLLOWERS, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (minimumNumberOfFollowersForMutation !== undefined) {
      updateMinimumFollowers({
        variables: {
          minimumInstagramFollowers: minimumNumberOfFollowersForMutation,
          campaignDraftId,
        },
      });
    }
  }, [campaignDraftId, minimumNumberOfFollowersForMutation, updateMinimumFollowers]);

  return (
    <NumberInput
      state={[minimumNumberOfFollowers || undefined, setMinimumNumberOfFollowersWithStateUpdates]}
      error={validationError}
      disabled={!hasBeenInitialized}
      fullWidth={true}
      label="Minimum followers"
    />
  );
};

export default CDraftMinimumNumberOfFollowers;
