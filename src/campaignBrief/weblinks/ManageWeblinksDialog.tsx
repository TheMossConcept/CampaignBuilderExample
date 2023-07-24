import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { createStyles, Divider, Grid, Theme, WithStyles, withStyles } from '@material-ui/core';
import React, { FunctionComponent } from 'react';

import { CampaignExternalLinkInputType } from '../../../../__generated__/types';
import BaseDialog from '../../../common/dialogs/BaseDialog';
import ExistingLinks from '../../../common/dialogs/links/ExistingLinks';
import BHMutation from '../../../common/error-components/BHMutation';
import BHQuery from '../../../common/error-components/BHQuery';
import {
  MutationRemoveExternalLink,
  MutationRemoveExternalLinkVariables,
} from './__generated__/MutationRemoveExternalLink';
import { QueryWeblinks, QueryWeblinksVariables } from './__generated__/QueryWeblinks';
import { Weblink } from './__generated__/Weblink';
import CreateWeblink from './CreateWeblink';
import ManageAssociatedProducts from './ManageAssociatedProducts';

// import { updateLocalDraftIds } from '../../../../../apollo/local-state/campaign/resolvers/utils';
interface IManageWeblinksDialogProps {
  campaignDraftId: string;
  closeDialog: () => void;
  dialogOpen: boolean;
  campaignId: string;
}

export type ManageWeblinksDialogProps = IManageWeblinksDialogProps;

const styles = (theme: Theme) =>
  createStyles({
    root: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      [theme.breakpoints.up('sm')]: {
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
      },
      overflowY: 'hidden',
    },
  });

type Props = ManageWeblinksDialogProps & WithStyles<typeof styles>;

const MUTATE_REMOVE_EXTERNAL_LINK = gql`
  mutation MutationRemoveExternalLink(
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

const manageWeblinksDialog: FunctionComponent<Props> = ({ campaignDraftId, closeDialog, dialogOpen, campaignId }) => {
  return (
    <BaseDialog title="Manage weblinks" closeText="close" onClose={closeDialog} open={dialogOpen}>
      <BHQuery<QueryWeblinks, QueryWeblinksVariables> query={QUERY_WEBLINKS} variables={{ campaignDraftId }}>
        {({ data, loading }) => {
          const existingWeblinks = getProp(data)
            .on('campaignDraft')
            .onValue('externalLinks')
            .get();
          const campaignDraftVersion = getProp(data)
            .on('campaignDraft')
            .on('version')
            .get();

          return (
            <Grid container={true} spacing={2}>
              <Grid item={true} xs={12}>
                <Grid container={true}>
                  <BHMutation<MutationRemoveExternalLink, MutationRemoveExternalLinkVariables>
                    mutation={MUTATE_REMOVE_EXTERNAL_LINK}
                  >
                    {(mutateWeblinksFn, { loading: deleteWeblinkLoading }) => {
                      const deleteWeblink = (weblink: Weblink) => {
                        const id = getProp(weblink)
                          .on('id')
                          .get();

                        const newWeblinksArray = existingWeblinks
                          ? existingWeblinks.filter(value => {
                              const existingId = getProp(value)
                                .on('id')
                                .get();
                              return existingId !== id;
                            })
                          : existingWeblinks;

                        const newWeblinksArrayConverted = newWeblinksArray
                          ? newWeblinksArray.map((newWeblink: Weblink) => {
                              const link = getProp(newWeblink)
                                .onValue('link')
                                .get();
                              const text = getProp(newWeblink)
                                .onValue('text')
                                .get();

                              return { link, text } as CampaignExternalLinkInputType;
                            })
                          : [];

                        if (campaignDraftVersion) {
                          mutateWeblinksFn({
                            refetchQueries: ['QueryWeblinks'],
                            variables: {
                              campaignDraftId,
                              campaignDraftVersion,
                              externalLinks: newWeblinksArrayConverted,
                            },
                          });
                        }
                      };
                      return (
                        <ExistingLinks
                          links={existingWeblinks || []}
                          // tslint:disable-next-line:jsx-no-lambda
                          getLinkUrl={(link: Weblink) =>
                            getProp(link)
                              .onValue('link')
                              .get() || ''
                          }
                          deletion={{ deleteFn: deleteWeblink, loading: deleteWeblinkLoading }}
                          linkDescription="A weblink can be used by an influencer to obtain the product(s) he/she need in order to participate in the campaign. Typically, it will be a Shopify link, but it does not have to be"
                          loading={loading}
                          auxilaryInformation={[{ key: 'text' }]}
                        />
                      );
                    }}
                  </BHMutation>
                </Grid>
              </Grid>
              <Grid item={true} xs={12}>
                <Divider />
              </Grid>
              {campaignDraftVersion && (
                <Grid item={true} xs={12}>
                  <CreateWeblink
                    campaignDraftId={campaignDraftId}
                    campaignDraftVersion={campaignDraftVersion}
                    existingLinks={existingWeblinks}
                  />
                </Grid>
              )}

              <Grid item={true} xs={12}>
                <Divider />
              </Grid>
              <Grid item={true} xs={12}>
                <ManageAssociatedProducts campaignId={campaignId} />
              </Grid>
            </Grid>
          );
        }}
      </BHQuery>
    </BaseDialog>
  );
};

const WeblinkFragment = gql`
  fragment Weblink on CampaignExternalLink {
    id
    version
    text {
      value
    }
    link {
      value
    }
  }
`;

const QUERY_WEBLINKS = gql`
  query QueryWeblinks($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      externalLinks {
        value {
          id
          ...Weblink
        }
      }
      campaignDraftMeta {
        value {
          id
          campaign {
            value {
              id
              associatedShopifyProducts {
                value {
                  id
                  shopifyProductId {
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  ${WeblinkFragment}
`;

// typed as any due to component expects styleprops when withStyles is typed in props
export const ManageWeblinksDialog = withStyles(styles)(manageWeblinksDialog) as any;
