import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftCoverImageQuery,
  CampaignDraftCoverImageQueryVariables,
} from './__generated__/CampaignDraftCoverImageQuery';
import {
  CampaignDraftCoverImageUpdate,
  CampaignDraftCoverImageUpdateVariables,
} from './__generated__/CampaignDraftCoverImageUpdate';

const MUTATION_COVER_IMAGE_UDPATE = gql`
  mutation CampaignDraftCoverImageUpdate($campaignDraftId: ID!, $coverImage: ID) {
    campaignDraftUpdateCoverImage(campaignDraftId: $campaignDraftId, coverImage: $coverImage) {
      id
      version
      coverImage {
        value {
          id
        }
      }
    }
  }
`;

const QUERY_COVER_IMAGE = gql`
  query CampaignDraftCoverImageQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      coverImage {
        value {
          id
        }
      }
    }
  }
`;

export const useCoverImage = (campaignDraftId: string, debounceValue: number | undefined = 0) => {
  const [coverImage, setCoverImage] = useState<string | undefined>();

  const { data, loading, error } = useBHQuery<CampaignDraftCoverImageQuery, CampaignDraftCoverImageQueryVariables>(
    QUERY_COVER_IMAGE,
    {
      variables: { campaignDraftId },
    },
  );

  const initialCoverImage = getProp(data)
    .on('campaignDraft')
    .onValue('coverImage')
    .on('id')
    .get();

  useCampaignFieldInitialization(initialCoverImage, setCoverImage, loading, error);

  const {
    valueForMutation: coverImageForMutation,
    setValueWithStateUpdates: setCoverImageWithStateUpdates,
    deregisterMutation: deregisterCoverImageMutation,
  } = useCampaignFieldState(
    [coverImage, setCoverImage],
    yupValidators.campaignDraft.coverImage,
    'cover image',
    debounceValue,
  );

  const [updateCoverImageMutation] = useBHMutation<
    CampaignDraftCoverImageUpdate,
    CampaignDraftCoverImageUpdateVariables
  >(MUTATION_COVER_IMAGE_UDPATE, {
    onCompleted: () => deregisterCoverImageMutation(true),
    onError: () => deregisterCoverImageMutation(false),
  });

  useEffect(() => {
    if (isDefined(coverImageForMutation)) {
      updateCoverImageMutation({
        variables: {
          campaignDraftId,
          coverImage: coverImageForMutation,
        },
      });
    }
  }, [campaignDraftId, coverImageForMutation, updateCoverImageMutation]);

  const onCoverImageChange = (newCoverImage: string) => setCoverImageWithStateUpdates(newCoverImage);

  return { coverImage, setCoverImage: onCoverImageChange };
};
