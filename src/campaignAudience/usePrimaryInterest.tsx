import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftPrimaryInterestQuery,
  CampaignDraftPrimaryInterestQueryVariables,
} from './__generated__/CampaignDraftPrimaryInterestQuery';
import {
  CampaignDraftPrimaryInterestUpdate,
  CampaignDraftPrimaryInterestUpdateVariables,
} from './__generated__/CampaignDraftPrimaryInterestUpdate';

const MUTATION_PRIMARY_INTEREST_UDPATE = gql`
  mutation CampaignDraftPrimaryInterestUpdate($campaignDraftId: ID!, $primaryInterest: ID) {
    campaignDraftUpdatePrimaryInterest(campaignDraftId: $campaignDraftId, primaryInterest: $primaryInterest) {
      id
      version
      primaryInterest {
        value {
          id
          version
        }
      }
    }
  }
`;

const QUERY_PRIMARY_INTEREST = gql`
  query CampaignDraftPrimaryInterestQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      primaryInterest {
        value {
          id
          version
        }
      }
    }
  }
`;

export const usePrimaryInterest = (
  campaignDraftId: string,
  debounceValue: number | undefined = 0,
  // For some reason, Typescript cannot correctly infer the return type of this hook
): [string | undefined, React.Dispatch<React.SetStateAction<string | null>>, () => void] => {
  const [primaryInterest, setPrimaryInterest] = useState<string | undefined | null>();
  const { data, loading, error } = useBHQuery<
    CampaignDraftPrimaryInterestQuery,
    CampaignDraftPrimaryInterestQueryVariables
  >(QUERY_PRIMARY_INTEREST, {
    variables: { campaignDraftId },
  });

  const initialPrimaryInterest = getProp(data)
    .on('campaignDraft')
    .onValue('primaryInterest')
    .on('id')
    .get();
  const [, setHasBeenInitialized] = useCampaignFieldInitialization(
    initialPrimaryInterest,
    setPrimaryInterest,
    loading,
    error,
  );
  const reinitialize = () => setHasBeenInitialized(false);

  const {
    valueForMutation: primaryInterestForMutation,
    setValueWithStateUpdates: setPrimaryInterestWithStateUpdates,
    deregisterMutation,
  } = useCampaignFieldState(
    [primaryInterest, setPrimaryInterest],
    yupValidators.campaignDraft.primaryInterest,
    'primary interest',
    debounceValue,
  );

  const [updateInterestsMutation] = useBHMutation<
    CampaignDraftPrimaryInterestUpdate,
    CampaignDraftPrimaryInterestUpdateVariables
  >(MUTATION_PRIMARY_INTEREST_UDPATE, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (primaryInterestForMutation !== undefined) {
      updateInterestsMutation({ variables: { campaignDraftId, primaryInterest: primaryInterestForMutation } });
    }
  }, [campaignDraftId, primaryInterestForMutation, updateInterestsMutation]);

  return [
    primaryInterest || undefined,
    // Undefined is needed for the internal state value in useCampaignFieldState but the user of this hook should NEVER set a primary interest to undefined
    setPrimaryInterestWithStateUpdates as React.Dispatch<React.SetStateAction<string | null>>,
    reinitialize,
  ];
};
