import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { Button, Dialog, DialogContent, DialogTitle, Grid } from '@material-ui/core';
import React, { FC, useState } from 'react';

import { MediaUpdateInput } from '../../../__generated__/types';
import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import InspirationMediaList, { getMediaToDisplayFromData } from '../../common/campaign/InspirationMediaList';
import MediaUploadInput from '../../common/form/MediaUploadInput';
import Loading from '../../common/Loading';
import { ImageFragments } from '../../common/media/image';
import { useCampaignFieldFeedback } from '../CampaignBuilderFeedback';
import {
  CampaignDraftInspirationMediaQuery,
  CampaignDraftInspirationMediaQueryVariables,
} from './__generated__/CampaignDraftInspirationMediaQuery';
import {
  CampaignDraftInspiriationMediaUpdate,
  CampaignDraftInspiriationMediaUpdateVariables,
} from './__generated__/CampaignDraftInspiriationMediaUpdate';
import { useCoverImage } from './useCoverImage';

const MUTATION_INSPIRATION_IMAGES_UDPATE = gql`
  mutation CampaignDraftInspiriationMediaUpdate($campaignDraftId: ID!, $inspirationImages: [MediaUpdateInput!]!) {
    campaignDraftUpdateInspirationImages(campaignDraftId: $campaignDraftId, inspirationImages: $inspirationImages) {
      id
      version
      inspirationImages {
        value {
          id
          ...Thumbnail
        }
      }
      inspirationVideos {
        value {
          id
          generic480p16x9Url {
            value
          }
        }
      }
    }
  }
  ${ImageFragments.Thumbnail}
`;

const QUERY_INSPIRATION_MEDIA = gql`
  query CampaignDraftInspirationMediaQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      inspirationImages {
        value {
          id
          ...Thumbnail
        }
      }
      inspirationVideos {
        value {
          id
          generic480p16x9Url {
            value
          }
        }
      }
    }
  }
  ${ImageFragments.Thumbnail}
`;

type Props = {
  campaignDraftId: string;
};

const CDraftInspirationMedia: FC<Props> = ({ campaignDraftId }) => {
  // const [hasBeenUpdated, setHasBeenUpdated] = useState(false);
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  const { data, loading: queryLoading, refetch } = useBHQuery<
    CampaignDraftInspirationMediaQuery,
    CampaignDraftInspirationMediaQueryVariables
  >(QUERY_INSPIRATION_MEDIA, {
    variables: { campaignDraftId },
  });

  const inspirationImages = getProp(data)
    .on('campaignDraft')
    .onValue('inspirationImages')
    .get();
  const inspirationVideos = getProp(data)
    .on('campaignDraft')
    .onValue('inspirationVideos')
    .get();

  const mediaToDisplay = getMediaToDisplayFromData(inspirationImages, inspirationVideos);

  const { registerMutation, deregisterMutation } = useCampaignFieldFeedback('inspiration images');

  const [updateInspirationImagesMutation, { loading: mutationLoading }] = useBHMutation<
    CampaignDraftInspiriationMediaUpdate,
    CampaignDraftInspiriationMediaUpdateVariables
  >(MUTATION_INSPIRATION_IMAGES_UDPATE, {
    onCompleted: () => {
      // setHasBeenUpdated(false);
      refetch();

      deregisterMutation(true);
    },
    onError: () => deregisterMutation(false),
  });

  const updateInspirationImages = (inspirationImagesUpdates: MediaUpdateInput[]) => {
    registerMutation();

    updateInspirationImagesMutation({
      variables: {
        campaignDraftId,
        inspirationImages: inspirationImagesUpdates,
      },
      context: { hasUpload: true },
    });
  };

  const loading = queryLoading || mutationLoading;

  const { coverImage, setCoverImage } = useCoverImage(campaignDraftId);
  return (
    <Grid container={true} spacing={2}>
      <Grid item={true} xs={12}>
        <Button variant="contained" color="primary" onClick={() => setDialogIsOpen(true)}>
          Manage inspiration images and videos
        </Button>
        <Dialog open={dialogIsOpen} onClose={() => setDialogIsOpen(false)}>
          <DialogTitle>Manage inspiration images</DialogTitle>
          <DialogContent>
            <MediaUploadInput
              initialMedia={mediaToDisplay}
              updateMedia={updateInspirationImages}
              validator={yupValidators.campaignDraft.inspirationImages}
              secondaryState={[coverImage, setCoverImage]}
              closeIfDialog={() => setDialogIsOpen(false)}
              loading={loading}
            />
          </DialogContent>
        </Dialog>
      </Grid>
      <Grid item={true} xs={12}>
        {loading ? (
          <Grid container={true} justifyContent="center">
            <Grid item={true}>
              <Loading variant="circular" />
            </Grid>
          </Grid>
        ) : (
          <InspirationMediaList mediaToDisplay={mediaToDisplay} />
        )}
      </Grid>
    </Grid>
  );
};

export default CDraftInspirationMedia;
