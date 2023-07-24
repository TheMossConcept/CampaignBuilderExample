import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { NumberInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftMinimumAgeQuery,
  CampaignDraftMinimumAgeQueryVariables,
} from './__generated__/CampaignDraftMinimumAgeQuery';
import {
  UpdateCampaignDraftMinimumAge,
  UpdateCampaignDraftMinimumAgeVariables,
} from './__generated__/UpdateCampaignDraftMinimumAge';

const MUTATE_UPDATE_MINIMUM_AGE = gql`
  mutation UpdateCampaignDraftMinimumAge($campaignDraftId: ID!, $minimumAge: Int) {
    campaignDraftUpdateMinimumAge(campaignDraftId: $campaignDraftId, minimumAge: $minimumAge) {
      id
      version
      minimumAge {
        value
      }
    }
  }
`;

const QUERY_MINIMUM_AGE = gql`
  query CampaignDraftMinimumAgeQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      minimumAge {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number; excludeField?: boolean };

const CDraftMinimumAge: FC<Props> = ({ campaignDraftId, debounceValue, excludeField = false }) => {
  const mutationName = 'minimum age';

  const [minimumAge, setMinimumAge] = useState<number | undefined>();

  const { data, loading, error } = useBHQuery<CampaignDraftMinimumAgeQuery, CampaignDraftMinimumAgeQueryVariables>(
    QUERY_MINIMUM_AGE,
    {
      variables: { campaignDraftId },
      skip: excludeField,
    },
  );
  const initialMinimumAge = getProp(data)
    .on('campaignDraft')
    .onValue('minimumAge')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(initialMinimumAge, setMinimumAge, loading, error);

  const {
    valueForMutation: minimumAgeForMutation,
    setValueWithStateUpdates: setMinimumAgeWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [minimumAge, setMinimumAge],
    yupValidators.campaignDraft.minimumAge,
    mutationName,
    debounceValue,
    {},
    excludeField,
  );

  const [updateMinimumFollowers] = useBHMutation<UpdateCampaignDraftMinimumAge, UpdateCampaignDraftMinimumAgeVariables>(
    MUTATE_UPDATE_MINIMUM_AGE,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(minimumAgeForMutation)) {
      updateMinimumFollowers({
        variables: { minimumAge: minimumAgeForMutation, campaignDraftId },
      });
    }
  }, [campaignDraftId, minimumAgeForMutation, updateMinimumFollowers]);

  return excludeField ? null : (
    <NumberInput
      state={[minimumAge, setMinimumAgeWithStateUpdates]}
      error={validationError}
      disabled={!hasBeenInitialized}
      fullWidth={true}
      label="Minimum age"
    />
  );
};

export default CDraftMinimumAge;
