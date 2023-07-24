import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { NumberInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftMaximumAgeQuery,
  CampaignDraftMaximumAgeQueryVariables,
} from './__generated__/CampaignDraftMaximumAgeQuery';
import {
  UpdateCampaignDraftMaximumAge,
  UpdateCampaignDraftMaximumAgeVariables,
} from './__generated__/UpdateCampaignDraftMaximumAge';

const MUTATE_UPDATE_MAXIMUM_AGE = gql`
  mutation UpdateCampaignDraftMaximumAge($campaignDraftId: ID!, $maximumAge: Int) {
    campaignDraftUpdateMaximumAge(campaignDraftId: $campaignDraftId, maximumAge: $maximumAge) {
      id
      version
      maximumAge {
        value
      }
    }
  }
`;

const QUERY_MAXIMUM_AGE = gql`
  query CampaignDraftMaximumAgeQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      maximumAge {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number; excludeField?: boolean };

const CDraftMaximumAge: FC<Props> = ({ campaignDraftId, debounceValue, excludeField = false }) => {
  const mutationName = 'maximum age';

  const [maximumAge, setMaximumAge] = useState<number | undefined>();

  const { data, loading, error } = useBHQuery<CampaignDraftMaximumAgeQuery, CampaignDraftMaximumAgeQueryVariables>(
    QUERY_MAXIMUM_AGE,
    {
      variables: { campaignDraftId },
      skip: excludeField,
    },
  );
  const initialMaximumAge = getProp(data)
    .on('campaignDraft')
    .onValue('maximumAge')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(initialMaximumAge, setMaximumAge, loading, error);

  const {
    valueForMutation: maximumAgeForMutation,
    setValueWithStateUpdates: setMaximumAgeWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [maximumAge, setMaximumAge],
    yupValidators.campaignDraft.maximumAge,
    mutationName,
    debounceValue,
    {},
    excludeField,
  );

  const [updateMaximumAge] = useBHMutation<UpdateCampaignDraftMaximumAge, UpdateCampaignDraftMaximumAgeVariables>(
    MUTATE_UPDATE_MAXIMUM_AGE,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(maximumAgeForMutation)) {
      updateMaximumAge({
        variables: { maximumAge: maximumAgeForMutation, campaignDraftId },
      });
    }
  }, [campaignDraftId, maximumAgeForMutation, updateMaximumAge]);

  return excludeField ? null : (
    <NumberInput
      state={[maximumAge, setMaximumAgeWithStateUpdates]}
      error={validationError}
      disabled={!hasBeenInitialized}
      fullWidth={true}
      label="Maximum age"
    />
  );
};

export default CDraftMaximumAge;
