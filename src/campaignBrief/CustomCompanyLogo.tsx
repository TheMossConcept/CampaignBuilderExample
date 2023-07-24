import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { Button, Dialog, DialogContent, DialogTitle, Grid } from '@material-ui/core';
import React, { FC, useState } from 'react';

import { MediaUpdateInput } from '../../../__generated__/types';
import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import MediaUploadInput from '../../common/form/MediaUploadInput';
import { ImageFragments } from '../../common/media/image';
import { useCampaignFieldFeedback } from '../CampaignBuilderFeedback';
import {
  CampaignDraftCompanyLogoQuery,
  CampaignDraftCompanyLogoQueryVariables,
} from './__generated__/CampaignDraftCompanyLogoQuery';
import {
  CampaignDraftCustomCompanyLogoUpdate,
  CampaignDraftCustomCompanyLogoUpdateVariables,
} from './__generated__/CampaignDraftCustomCompanyLogoUpdate';

const MUTATION_CUSTOM_COMPANY_LOGO_UPDATE = gql`
  mutation CampaignDraftCustomCompanyLogoUpdate($campaignDraftId: ID!, $companyLogo: MediaUpdateInput!) {
    campaignDraftUpdateCompanyLogo(campaignDraftId: $campaignDraftId, companyLogo: $companyLogo) {
      id
      version
      companyLogo {
        value {
          id
          ...Thumbnail
        }
      }
    }
  }
  ${ImageFragments.Thumbnail}
`;

const QUERY_CAMPAIGN_DRAFT_CUSTOM_COMPANY_LOGO = gql`
  query CampaignDraftCompanyLogoQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      companyLogo {
        value {
          id
          ...Thumbnail
        }
      }
    }
  }
  ${ImageFragments.Thumbnail}
`;

type Props = {
  campaignDraftId: string;
};

const CDraftCustomCompanyLogo: FC<Props> = ({ campaignDraftId }) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  const { data, refetch } = useBHQuery<CampaignDraftCompanyLogoQuery, CampaignDraftCompanyLogoQueryVariables>(
    QUERY_CAMPAIGN_DRAFT_CUSTOM_COMPANY_LOGO,
    {
      variables: { campaignDraftId },
    },
  );

  const { registerMutation, deregisterMutation } = useCampaignFieldFeedback('custom company logo');

  const [updateCustomCompanyLogoMutation] = useBHMutation<
    CampaignDraftCustomCompanyLogoUpdate,
    CampaignDraftCustomCompanyLogoUpdateVariables
  >(MUTATION_CUSTOM_COMPANY_LOGO_UPDATE, {
    onCompleted: () => {
      // setHasBeenUpdated(false);
      refetch();

      deregisterMutation(true);
    },
    onError: () => deregisterMutation(false),
  });

  const updateCustomCompanyLogo = (customCompanyLogoUpdates: MediaUpdateInput[]) => {
    registerMutation();

    updateCustomCompanyLogoMutation({
      variables: {
        campaignDraftId,
        /*
         * We have to just assume this always has length at least one, otherwise we get into trouble with Typescript because we don't have a fallback value.
         * Since the array consists of change events, the assumption should be valid (it does not make sense to call this function with an empty array as that
         * would be the same as requesting a change with no changes)
         */
        companyLogo: customCompanyLogoUpdates[0],
      },
      context: { hasUpload: true },
    });
  };

  const companyLogoId = getProp(data)
    .on('campaignDraft')
    .onValue('companyLogo')
    .on('id')
    .get();

  const companyLogoSrc = getProp(data)
    .on('campaignDraft')
    .onValue('companyLogo')
    .onValue('thumbnail')
    .get();

  return (
    <Grid container={true} spacing={2}>
      <Grid item={true} xs={12}>
        <Button variant="contained" color="primary" onClick={() => setDialogIsOpen(true)}>
          Upload custom company logo
        </Button>
        <Dialog open={dialogIsOpen} onClose={() => setDialogIsOpen(false)}>
          <DialogTitle>Upload custom company logo</DialogTitle>
          <DialogContent>
            <MediaUploadInput
              // Right now, only images are allowed as custom company logos
              initialMedia={
                companyLogoId && companyLogoSrc
                  ? [{ id: companyLogoId, src: companyLogoSrc, isImage: true, isVideo: false }]
                  : []
              }
              updateMedia={updateCustomCompanyLogo}
              validator={yupValidators.campaignDraft.companyLogo}
              closeIfDialog={() => setDialogIsOpen(false)}
              multiple={false}
            />
          </DialogContent>
        </Dialog>
      </Grid>
    </Grid>
  );
};

export default CDraftCustomCompanyLogo;
