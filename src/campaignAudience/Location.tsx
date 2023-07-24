import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import LocationInput from '../../common/form/LocationInput';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftLocationQuery,
  CampaignDraftLocationQueryVariables,
} from './__generated__/CampaignDraftLocationQuery';
import {
  CampaignDraftLocationUpdate,
  CampaignDraftLocationUpdateVariables,
} from './__generated__/CampaignDraftLocationUpdate';

type Props = {
  campaignDraftId: string;
  debounceValue?: number;
  excludeField?: boolean;
};

const MUTATION_LOCATION_UDPATE = gql`
  mutation CampaignDraftLocationUpdate($campaignDraftId: ID!, $locationId: String) {
    campaignDraftUpdateLocation(campaignDraftId: $campaignDraftId, locationId: $locationId) {
      id
      version
      location {
        value {
          id
          placeId {
            value
          }
        }
      }
    }
  }
`;

const QUERY_LOCATION = gql`
  query CampaignDraftLocationQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      location {
        value {
          id
          placeId {
            value
          }
        }
      }
    }
  }
`;

// The location debounce occurs when a location is selected, but since this is a discrete step (like checking a switch), there is no need for a debounce
const CDraftLocation: FC<Props> = ({ campaignDraftId, debounceValue = 0, excludeField = false }) => {
  const mutationName = 'location';

  const [placeId, setPlaceId] = useState<string | undefined>();

  const { data, loading, error } = useBHQuery<CampaignDraftLocationQuery, CampaignDraftLocationQueryVariables>(
    QUERY_LOCATION,
    {
      variables: { campaignDraftId },
      skip: excludeField,
    },
  );
  const initialPlaceId = getProp(data)
    .on('campaignDraft')
    .onValue('location')
    .onValue('placeId')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(initialPlaceId, setPlaceId, loading, error);

  const {
    valueForMutation: placeIdForMutation,
    setValueWithStateUpdates: setPlaceIdWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [placeId, setPlaceId],
    yupValidators.campaignDraft.locationId,
    mutationName,
    debounceValue,
    {},
    excludeField,
  );

  const [updatePlaceIdMutation] = useBHMutation<CampaignDraftLocationUpdate, CampaignDraftLocationUpdateVariables>(
    MUTATION_LOCATION_UDPATE,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(placeIdForMutation)) {
      updatePlaceIdMutation({ variables: { campaignDraftId, locationId: placeIdForMutation } });
    }
  }, [campaignDraftId, placeIdForMutation, updatePlaceIdMutation]);

  return excludeField ? null : (
    <LocationInput
      state={[placeId, setPlaceIdWithStateUpdates]}
      error={validationError}
      disabled={!hasBeenInitialized}
      fullWidth={true}
    />
  );
};

export default CDraftLocation;
