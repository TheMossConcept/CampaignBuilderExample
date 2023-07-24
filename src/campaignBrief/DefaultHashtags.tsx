import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { TextToChipsInput, ValidChipPrefixes } from '../../common/form/ChipInputs';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftDefaultHashtagsQuery,
  CampaignDraftDefaultHashtagsQueryVariables,
} from './__generated__/CampaignDraftDefaultHashtagsQuery';
import {
  CampaignDraftDefaultHashtagsUpdate,
  CampaignDraftDefaultHashtagsUpdateVariables,
} from './__generated__/CampaignDraftDefaultHashtagsUpdate';

type Props = {
  campaignDraftId: string;
  debounceValue?: number;
};

const MUTATION_DEFAULT_HASHTAGS_UDPATE = gql`
  mutation CampaignDraftDefaultHashtagsUpdate($campaignDraftId: ID!, $defaultHashtags: [String!]!) {
    campaignDraftUpdateDefaultHashtags(campaignDraftId: $campaignDraftId, defaultHashtags: $defaultHashtags) {
      id
      version
      defaultHashtags {
        value
      }
    }
  }
`;

const QUERY_DEFAULT_HASHTAGS = gql`
  query CampaignDraftDefaultHashtagsQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      defaultHashtags {
        value
      }
    }
  }
`;

export const CDraftDefaultHashtags: FC<Props> = ({ campaignDraftId, debounceValue = 0 }) => {
  const [defaultHashtags, setDefaultHashtags] = useState<string[] | undefined>();

  const { data, loading, error } = useBHQuery<
    CampaignDraftDefaultHashtagsQuery,
    CampaignDraftDefaultHashtagsQueryVariables
  >(QUERY_DEFAULT_HASHTAGS, {
    variables: { campaignDraftId },
  });
  const initialDefaultHashtags = getProp(data)
    .on('campaignDraft')
    .onValue('defaultHashtags')
    .get();
  const initialDefaultHashtagsStringArray = initialDefaultHashtags
    ? (initialDefaultHashtags.filter(hashtag => isDefined(hashtag)) as string[])
    : undefined;
  const [hasBeenInitialized] = useCampaignFieldInitialization(
    initialDefaultHashtagsStringArray,
    setDefaultHashtags,
    loading,
    error,
  );

  const {
    valueForMutation: defaultHashtagsForMutation,
    setValueWithStateUpdates: setDefaultHashtagsStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [defaultHashtags, setDefaultHashtags],
    yupValidators.campaignDraft.defaultHashtags,
    'required hashtags',
    debounceValue,
  );

  const deleteChip = (indexOfChip: number) => {
    setDefaultHashtagsStateUpdates(defaultHashtags ? defaultHashtags.filter((_, index) => index !== indexOfChip) : []);
  };

  const [updateDefaultHashtagsMutation] = useBHMutation<
    CampaignDraftDefaultHashtagsUpdate,
    CampaignDraftDefaultHashtagsUpdateVariables
  >(MUTATION_DEFAULT_HASHTAGS_UDPATE, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (isDefined(defaultHashtagsForMutation)) {
      updateDefaultHashtagsMutation({ variables: { campaignDraftId, defaultHashtags: defaultHashtagsForMutation } });
    }
  }, [campaignDraftId, defaultHashtagsForMutation, updateDefaultHashtagsMutation]);

  return (
    <TextToChipsInput
      state={[defaultHashtags || [], setDefaultHashtagsStateUpdates]}
      prefixCharacter={ValidChipPrefixes['#']}
      deleteChip={deleteChip}
      error={validationError}
      fullWidth={true}
      disabled={!hasBeenInitialized}
      label="Required hashtags"
    />
  );
};
