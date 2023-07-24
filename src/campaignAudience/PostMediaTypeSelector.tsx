import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
// import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { PostMediaType } from '../../../__generated__/types';
import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { RadioButtonsInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftPostMediaQuery,
  CampaignDraftPostMediaQueryVariables,
} from './__generated__/CampaignDraftPostMediaQuery';
import {
  UpdateCampaignDraftPostMedia,
  UpdateCampaignDraftPostMediaVariables,
} from './__generated__/UpdateCampaignDraftPostMedia';

const MUTATE_UPDATE_POST_MEDIA = gql`
  mutation UpdateCampaignDraftPostMedia($campaignDraftId: ID!, $postMedia: [PostMediaType!]!) {
    campaignDraftUpdatePostMedia(campaignDraftId: $campaignDraftId, postMedia: $postMedia) {
      id
      version
      postMedia {
        value
      }
    }
  }
`;

const QUERY_POST_MEDIA = gql`
  query CampaignDraftPostMediaQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      postMedia {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number };

const CDraftPostMediaType: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [postMedia, setPostMedia] = useState<PostMediaType[] | undefined>();

  const { data, loading, error } = useBHQuery<CampaignDraftPostMediaQuery, CampaignDraftPostMediaQueryVariables>(
    QUERY_POST_MEDIA,
    {
      variables: { campaignDraftId },
    },
  );
  const initialPostMedia = getProp(data)
    .on('campaignDraft')
    .onValue('postMedia')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(
    // Only one post media type is allowed pr campaign, so for older campaigns with more, we disregard them both to force the BHE to select one
    initialPostMedia && initialPostMedia.length > 1 ? undefined : initialPostMedia,
    setPostMedia,
    loading,
    error,
  );

  const {
    valueForMutation: postMediaForMutation,
    setValueWithStateUpdates: setPostMediaWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [postMedia, setPostMedia],
    // yupValidators.campaignDraft.postMedia,
    null,
    'post media',
    debounceValue,
  );

  const [updatePostMediaType] = useBHMutation<UpdateCampaignDraftPostMedia, UpdateCampaignDraftPostMediaVariables>(
    MUTATE_UPDATE_POST_MEDIA,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(postMediaForMutation)) {
      updatePostMediaType({
        variables: { postMedia: postMediaForMutation, campaignDraftId },
      });
    }
  }, [campaignDraftId, postMediaForMutation, updatePostMediaType]);

  const setPostMediaWrapper = (newValue: string | undefined) => {
    if (newValue && Object.keys(PostMediaType).includes(newValue)) {
      setPostMediaWithStateUpdates([PostMediaType[newValue]]);
    }
  };

  const possibleValues = Object.keys(PostMediaType).map(postMediaKey => {
    const postMediaTypeValue = PostMediaType[postMediaKey];

    switch (postMediaTypeValue) {
      case PostMediaType.InstagramFeed:
        return { label: 'Instagram submission', value: postMediaKey };
      case PostMediaType.InstagramStory:
        return { label: 'Instagram story', value: postMediaKey };
      case PostMediaType.TikTokPost:
        return { label: 'TikTok post', value: postMediaKey };
      default:
        return null;
    }
  });

  return (
    <RadioButtonsInput
      // You can only select one, so always use the first element in this array
      state={[postMedia && postMedia.length > 0 ? postMedia[0] : undefined, setPostMediaWrapper]}
      color="primary"
      possibleValues={possibleValues}
      disabled={!hasBeenInitialized}
      error={validationError}
    />
  );
};

export default CDraftPostMediaType;
