import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { TextInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import { CampaignDraftTitleQuery, CampaignDraftTitleQueryVariables } from './__generated__/CampaignDraftTitleQuery';
import { CampaignDraftTitleUpdate, CampaignDraftTitleUpdateVariables } from './__generated__/CampaignDraftTitleUpdate';

type Props = {
  campaignDraftId: string;
  debounceValue?: number;
};

const MUTATION_TITLE_UDPATE = gql`
  mutation CampaignDraftTitleUpdate($campaignDraftId: ID!, $campaignDraftTitle: String!) {
    campaignDraftUpdateTitle(campaignDraftId: $campaignDraftId, title: $campaignDraftTitle) {
      id
      version
      title {
        value
      }
    }
  }
`;

const QUERY_TITLE = gql`
  query CampaignDraftTitleQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      title {
        value
      }
    }
  }
`;

export const CDraftTitle: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [title, setTitle] = useState<string | undefined>();

  const { data, loading, error } = useBHQuery<CampaignDraftTitleQuery, CampaignDraftTitleQueryVariables>(QUERY_TITLE, {
    variables: { campaignDraftId },
  });
  const initialTitle = getProp(data)
    .on('campaignDraft')
    .onValue('title')
    .get();

  const [hasBeenInitialized] = useCampaignFieldInitialization(initialTitle, setTitle, loading, error);

  const {
    valueForMutation: titleForMutation,
    setValueWithStateUpdates: setTitleWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState([title, setTitle], yupValidators.campaignDraft.title, 'title', debounceValue);

  const [updateTitleMutation] = useBHMutation<CampaignDraftTitleUpdate, CampaignDraftTitleUpdateVariables>(
    MUTATION_TITLE_UDPATE,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(titleForMutation)) {
      updateTitleMutation({ variables: { campaignDraftId, campaignDraftTitle: titleForMutation } });
    }
  }, [campaignDraftId, titleForMutation, updateTitleMutation]);

  return (
    <TextInput
      state={[title, setTitleWithStateUpdates]}
      error={validationError}
      fullWidth={true}
      disabled={!hasBeenInitialized}
      label="Title"
    />
  );
};
