import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { PostMediaType } from '../../../__generated__/types';
import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { TextInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftDefaultCaptionQuery,
  CampaignDraftDefaultCaptionQueryVariables,
} from './__generated__/CampaignDraftDefaultCaptionQuery';
import {
  CampaignDraftDefaultCaptionUpdate,
  CampaignDraftDefaultCaptionUpdateVariables,
} from './__generated__/CampaignDraftDefaultCaptionUpdate';

type Props = {
  campaignDraftId: string;
  debounceValue?: number;
};

const MUTATION_DEFAULT_CAPTION_UDPATE = gql`
  mutation CampaignDraftDefaultCaptionUpdate($campaignDraftId: ID!, $caption: String) {
    campaignDraftUpdateDefaultCaption(campaignDraftId: $campaignDraftId, defaultCaption: $caption) {
      id
      version
      defaultCaption {
        value
      }
    }
  }
`;

const QUERY_DEFAULT_CAPTION = gql`
  query CampaignDraftDefaultCaptionQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      defaultCaption {
        value
      }
      defaultHashtags {
        value
      }
      defaultAccountTags {
        value
      }
      postMedia {
        value
      }
    }
  }
`;

export const CDraftDefaultCaption: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [defaultCaption, setDefaultCaption] = useState<string | undefined | null>();

  const { data, loading, error } = useBHQuery<
    CampaignDraftDefaultCaptionQuery,
    CampaignDraftDefaultCaptionQueryVariables
  >(QUERY_DEFAULT_CAPTION, {
    variables: { campaignDraftId },
  });
  const initialDefaultCaption = getProp(data)
    .on('campaignDraft')
    .onValue('defaultCaption')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(initialDefaultCaption, setDefaultCaption, loading, error);

  const hashtags = getProp(data)
    .on('campaignDraft')
    .onValue('defaultHashtags')
    .get();
  const accounts = getProp(data)
    .on('campaignDraft')
    .onValue('defaultAccountTags')
    .get();
  const postMediaTypes = getProp(data)
    .on('campaignDraft')
    .onValue('postMedia')
    .get();
  // Only one is allowed, so this should be a safe assumption (at least only that restriction changes)
  const postMediaType = postMediaTypes && postMediaTypes.length > 0 ? postMediaTypes[0] : undefined;

  const {
    valueForMutation: defaultCaptionForMutation,
    setValueWithStateUpdates: setDefaultCaptionWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [defaultCaption, setDefaultCaption],
    yupValidators.fieldValidators.validateCampaignSubmissionCaption,
    'default caption',
    debounceValue,
    { context: { hashtags, accounts, postMediaType } },
  );

  const [updateDefaultCaptionMutation] = useBHMutation<
    CampaignDraftDefaultCaptionUpdate,
    CampaignDraftDefaultCaptionUpdateVariables
  >(MUTATION_DEFAULT_CAPTION_UDPATE, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (defaultCaptionForMutation !== undefined) {
      updateDefaultCaptionMutation({ variables: { campaignDraftId, caption: defaultCaptionForMutation } });
    }
  }, [campaignDraftId, defaultCaptionForMutation, updateDefaultCaptionMutation]);

  const setDefaultCaptionWithStateUpdatesWrapper = (newValue: string) => {
    // If we set this to null when the default caption is required, we get an incorrect error message
    if (newValue === '' && postMediaType === PostMediaType.InstagramStory) {
      // This is the correct empty value. An empty string will cause validation erros as yup will (correctly) interpret it as an actual value
      setDefaultCaptionWithStateUpdates(null);
    } else {
      setDefaultCaptionWithStateUpdates(newValue);
    }
  };

  return (
    <TextInput
      state={[defaultCaption || undefined, setDefaultCaptionWithStateUpdatesWrapper]}
      error={validationError}
      disabled={!hasBeenInitialized}
      fullWidth={true}
      label="Default caption"
    />
  );
};
