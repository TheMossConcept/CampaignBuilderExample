import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { TextToChipsInput, ValidChipPrefixes } from '../../common/form/ChipInputs';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftDefaultAccountsQuery,
  CampaignDraftDefaultAccountsQueryVariables,
} from './__generated__/CampaignDraftDefaultAccountsQuery';
import {
  CampaignDraftDefaultAccountsUpdate,
  CampaignDraftDefaultAccountsUpdateVariables,
} from './__generated__/CampaignDraftDefaultAccountsUpdate';

type Props = {
  campaignDraftId: string;
  debounceValue?: number;
};

const MUTATION_DEFAULT_ACCOUNTS_UDPATE = gql`
  mutation CampaignDraftDefaultAccountsUpdate($campaignDraftId: ID!, $defaultAccountTags: [String!]!) {
    campaignDraftUpdateDefaultAccountTags(campaignDraftId: $campaignDraftId, defaultAccountTags: $defaultAccountTags) {
      id
      version
      defaultAccountTags {
        value
      }
    }
  }
`;

const QUERY_DEFAULT_ACCOUNTS = gql`
  query CampaignDraftDefaultAccountsQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      defaultAccountTags {
        value
      }
    }
  }
`;

export const CDraftDefaultAccountTags: FC<Props> = ({ campaignDraftId, debounceValue = 0 }) => {
  const [defaultAccounts, setDefaultAccounts] = useState<string[] | undefined>();

  const { data, loading, error } = useBHQuery<
    CampaignDraftDefaultAccountsQuery,
    CampaignDraftDefaultAccountsQueryVariables
  >(QUERY_DEFAULT_ACCOUNTS, {
    variables: { campaignDraftId },
  });
  const initialDefaultAccounts = getProp(data)
    .on('campaignDraft')
    .onValue('defaultAccountTags')
    .get();
  const initialDefaultAccountsStringArray = initialDefaultAccounts
    ? (initialDefaultAccounts.filter(account => isDefined(account)) as string[])
    : undefined;
  const [hasBeenInitialized] = useCampaignFieldInitialization(
    initialDefaultAccountsStringArray,
    setDefaultAccounts,
    loading,
    error,
  );

  const {
    valueForMutation: defaultAccountsForMutation,
    setValueWithStateUpdates: setDefaultAccountsStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [defaultAccounts, setDefaultAccounts],
    yupValidators.campaignDraft.defaultAccountTags,
    'required account tags',
    debounceValue,
  );

  const deleteChip = (indexOfChip: number) => {
    setDefaultAccountsStateUpdates(defaultAccounts ? defaultAccounts.filter((_, index) => index !== indexOfChip) : []);
  };

  const [updateDefaultAccountsMutation] = useBHMutation<
    CampaignDraftDefaultAccountsUpdate,
    CampaignDraftDefaultAccountsUpdateVariables
  >(MUTATION_DEFAULT_ACCOUNTS_UDPATE, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (isDefined(defaultAccountsForMutation)) {
      updateDefaultAccountsMutation({ variables: { campaignDraftId, defaultAccountTags: defaultAccountsForMutation } });
    }
  }, [campaignDraftId, defaultAccountsForMutation, updateDefaultAccountsMutation]);

  return (
    <TextToChipsInput
      state={[defaultAccounts || [], setDefaultAccountsStateUpdates]}
      prefixCharacter={ValidChipPrefixes['@']}
      deleteChip={deleteChip}
      error={validationError}
      disabled={!hasBeenInitialized}
      fullWidth={true}
      label="Required account tags"
    />
  );
};
