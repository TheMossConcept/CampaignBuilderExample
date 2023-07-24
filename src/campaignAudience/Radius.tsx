import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { NumberInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import { CampaignDraftRadiusQuery, CampaignDraftRadiusQueryVariables } from './__generated__/CampaignDraftRadiusQuery';
import {
  UpdateCampaignDraftRadius,
  UpdateCampaignDraftRadiusVariables,
} from './__generated__/UpdateCampaignDraftRadius';

const MUTATE_UPDATE_RADIUS = gql`
  mutation UpdateCampaignDraftRadius($campaignDraftId: ID!, $radiusInMeters: Int!) {
    campaignDraftUpdateRadiusInMeters(campaignDraftId: $campaignDraftId, radiusInMeters: $radiusInMeters) {
      id
      version
      radiusInMeters {
        value
      }
    }
  }
`;

const QUERY_RADIUS = gql`
  query CampaignDraftRadiusQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      radiusInMeters {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number; disabled?: boolean; excludeField?: boolean };

const CDraftRadius: FC<Props> = ({ campaignDraftId, debounceValue, disabled = false, excludeField = false }) => {
  const mutationName = 'radius';

  const [radiusInMeters, setRadius] = useState<number | undefined>();

  const { data, loading, error } = useBHQuery<CampaignDraftRadiusQuery, CampaignDraftRadiusQueryVariables>(
    QUERY_RADIUS,
    {
      variables: { campaignDraftId },
      skip: excludeField,
    },
  );
  const initialRadius = getProp(data)
    .on('campaignDraft')
    .onValue('radiusInMeters')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(initialRadius, setRadius, loading, error);

  const {
    valueForMutation: radiusForMutation,
    setValueWithStateUpdates: setRadiusWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [radiusInMeters, setRadius],
    yupValidators.campaignDraft.radiusInMeters,
    mutationName,
    debounceValue,
    {},
    excludeField || disabled,
  );

  const [updateMinimumFollowers] = useBHMutation<UpdateCampaignDraftRadius, UpdateCampaignDraftRadiusVariables>(
    MUTATE_UPDATE_RADIUS,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(radiusForMutation)) {
      updateMinimumFollowers({
        variables: { radiusInMeters: radiusForMutation, campaignDraftId },
      });
    }
  }, [campaignDraftId, radiusForMutation, updateMinimumFollowers]);

  const setRadiusWithStateUpdatesWrapper = (newValue: number) => setRadiusWithStateUpdates(newValue * 1000);
  const radiusInKilometers = radiusInMeters ? radiusInMeters / 1000 : undefined;

  return excludeField ? null : (
    <NumberInput
      state={[radiusInKilometers, setRadiusWithStateUpdatesWrapper]}
      error={validationError}
      disabled={disabled || !hasBeenInitialized}
      fullWidth={true}
      label="Radius in km"
    />
  );
};

export default CDraftRadius;
