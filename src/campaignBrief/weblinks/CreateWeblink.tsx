import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { Grid, TextField } from '@material-ui/core';
import React, { ChangeEvent, FC, useState } from 'react';

import { CampaignExternalLinkInputType } from '../../../../__generated__/types';
// import { updateLocalDraftIds } from '../../../../../apollo/local-state/campaign/resolvers/utils';
import LinkCreation from '../../../common/dialogs/links/LinkCreation';
import BHMutation from '../../../common/error-components/BHMutation';
import {
  MutationCreateExternalLink,
  MutationCreateExternalLinkVariables,
} from './__generated__/MutationCreateExternalLink';
import { Weblink } from './__generated__/Weblink';

interface ICreateShareableLinkProps {
  campaignDraftId: string;
  campaignDraftVersion: number;
  existingLinks?: Weblink[] | null;
}

const MUTATE_CREATE_WEBLINK = gql`
  mutation MutationCreateExternalLink(
    $campaignDraftId: ID!
    $campaignDraftVersion: Int!
    $externalLinks: [CampaignExternalLinkInputType!]
  ) {
    campaignDraftUpdate(
      campaignDraftId: $campaignDraftId
      version: $campaignDraftVersion
      externalLinks: $externalLinks
    ) {
      id
      version
    }
  }
`;

export type CreateCampaignReservationLinkProps = ICreateShareableLinkProps;

type Props = CreateCampaignReservationLinkProps;

const CreateWeblink: FC<Props> = ({ campaignDraftId, campaignDraftVersion, existingLinks }) => {
  const [slug, setSlug] = useState('');
  const [linkText, setLinkText] = useState('');
  const [discountCode, setDiscountCode] = useState('');

  return (
    <BHMutation<MutationCreateExternalLink, MutationCreateExternalLinkVariables>
      mutation={MUTATE_CREATE_WEBLINK}
      refetchQueries={['QueryWeblinks']}
      onCompleted={
        // tslint:disable-next-line:jsx-no-lambda
        () => {
          setSlug('');
          setLinkText('');
          setDiscountCode('');
        }
      }
    >
      {(weblinkCreateFn, { loading }) => {
        const onCreate = () => {
          const convertedExistingWeblinks = existingLinks
            ? existingLinks.map((weblink: Weblink) => {
                const text = getProp(weblink)
                  .onValue('text')
                  .get();
                const link = getProp(weblink)
                  .onValue('link')
                  .get();

                return { text, link } as CampaignExternalLinkInputType;
              })
            : [];

          weblinkCreateFn({
            variables: {
              campaignDraftId,
              campaignDraftVersion,
              externalLinks: [
                ...convertedExistingWeblinks,
                {
                  link: discountCode ? `${slug}${slug.indexOf('?') > 0 ? '&' : '?'}discount=${discountCode}` : slug,
                  text: linkText,
                } as CampaignExternalLinkInputType,
              ],
            },
          });
        };

        const onTextChange = (event: ChangeEvent<HTMLInputElement>) => {
          const value = event.target.value;
          setLinkText(value);
        };

        const onDiscountCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
          const value = event.target.value;
          setDiscountCode(value.trim());
        };

        return (
          <Grid container={true} spacing={2}>
            <Grid item={true} xs={12}>
              <TextField value={linkText} onChange={onTextChange} label="Link name" fullWidth={true} />
              <TextField value={discountCode} onChange={onDiscountCodeChange} label="Discount code" fullWidth={true} />
            </Grid>
            <Grid item={true} xs={12}>
              <LinkCreation
                onCreate={onCreate}
                loading={loading}
                linkCreationValue={[slug, setSlug]}
                headline="Create weblink for the campaign"
              />
            </Grid>
          </Grid>
        );
      }}
    </BHMutation>
  );
};

export default CreateWeblink;
