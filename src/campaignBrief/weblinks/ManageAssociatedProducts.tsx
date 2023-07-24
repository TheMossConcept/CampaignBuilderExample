import { gql } from '@apollo/client';
import { Button, Grid, IconButton, Link, TextField, Typography } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import React, { useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../../apollo/BHApolloProvider';
import Loading from '../../../common/Loading';
import {
  AssociateShopifyProductWithCampaign,
  AssociateShopifyProductWithCampaignVariables,
} from './__generated__/AssociateShopifyProductWithCampaign';
import {
  CurrentlyAssociatedProducts,
  CurrentlyAssociatedProductsVariables,
} from './__generated__/CurrentlyAssociatedProducts';
import {
  DisassociateShopifyProductWithCampaign,
  DisassociateShopifyProductWithCampaignVariables,
} from './__generated__/DisassociateShopifyProductWithCampaign';

interface Props {
  campaignId: string;
}

const ManageAssociatedProducts: React.FC<Props> = ({ campaignId }) => {
  const [shopifyProductId, setShopifyProductId] = useState<string | undefined>(undefined);
  const { data: associatedProducts, loading: associatedProductsLoading } = useBHQuery<
    CurrentlyAssociatedProducts,
    CurrentlyAssociatedProductsVariables
  >(QUERY_ASSOCIATED_PRODUCTS, { variables: { campaignId } });
  const [associateProductMutation, { loading: associateProductMutationLoading }] = useBHMutation<
    AssociateShopifyProductWithCampaign,
    AssociateShopifyProductWithCampaignVariables
  >(MUTATE_ASSOCIATE_PRODUCT, {
    variables: { campaignId, shopifyProductId: shopifyProductId || '' },
  });

  const [dissociateProductMutation, { loading: dissociateProductMutationLoading }] = useBHMutation<
    DisassociateShopifyProductWithCampaign,
    DisassociateShopifyProductWithCampaignVariables
  >(MUTATE_DISSOCIATE_PRODUCT, {
    variables: { campaignId, shopifyProductId: shopifyProductId || '' },
  });

  return (
    <Grid style={{ marginTop: 8 }}>
      <Typography variant="subtitle2">Associate products</Typography>
      <Typography variant="body1">
        This allows you to link orders for a specific product on Shopify to this campaign. If you do this, all orders
        for that product will show up as orders for this campaign, even if you did not provide a discount code for the
        buy link
      </Typography>
      {associatedProductsLoading && <Loading variant="circular" />}
      {associatedProducts &&
        associatedProducts.campaign?.associatedShopifyProducts?.value &&
        associatedProducts.campaign?.associatedShopifyProducts?.value.length > 0 &&
        associatedProducts.campaign?.associatedShopifyProducts?.value.map(product => {
          return (
            <Grid container key={product.id} alignItems="center">
              {product.shopifyProductId?.value && (
                <Link
                  href={`https://brandheroes.myshopify.com/admin/products/` + product.shopifyProductId?.value}
                  target="_blank"
                >
                  {product.shopifyProductId?.value}
                </Link>
              )}
              {/* <Typography>{product.shopifyProductId?.value || 'Id not available'}</Typography> */}
              <IconButton
                color="inherit"
                onClick={() => {
                  dissociateProductMutation({
                    variables: { campaignId, shopifyProductId: product.shopifyProductId?.value || '' },
                  });
                }}
                disabled={dissociateProductMutationLoading}
              >
                {dissociateProductMutationLoading ? <Loading variant="button" /> : <DeleteIcon color={'error'} />}
              </IconButton>
            </Grid>
          );
        })}
      <Grid container alignItems="center" spacing={4}>
        <Grid item xs={8}>
          <TextField
            fullWidth={true}
            value={shopifyProductId}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              if (event.target.value.length < 20) {
                // Sanity test of input
                setShopifyProductId(event.target.value);
              }
            }}
            label="Shopify ID"
            onKeyPress={(event: React.KeyboardEvent<HTMLInputElement>) => {
              if (event.key === 'Enter') {
                associateProductMutation();
                setShopifyProductId('');
              }
            }}
            disabled={associateProductMutationLoading}
          />
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              associateProductMutation();
              setShopifyProductId('');
            }}
            disabled={associateProductMutationLoading}
          >
            Link to campaign
            {associateProductMutationLoading && <Loading variant="button" />}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

const QUERY_ASSOCIATED_PRODUCTS = gql`
  query CurrentlyAssociatedProducts($campaignId: ID!) {
    campaign(id: $campaignId) {
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
`;

const MUTATE_ASSOCIATE_PRODUCT = gql`
  mutation AssociateShopifyProductWithCampaign($campaignId: ID!, $shopifyProductId: String!) {
    campaignAssociateShopifyProduct(campaignId: $campaignId, shopifyProductId: $shopifyProductId) {
      id
      associatedShopifyProducts {
        value {
          id
          shopifyProductId {
            value
          }
          campaign {
            value {
              id
              name {
                value
              }
            }
          }
        }
      }
    }
  }
`;

const MUTATE_DISSOCIATE_PRODUCT = gql`
  mutation DisassociateShopifyProductWithCampaign($campaignId: ID!, $shopifyProductId: String!) {
    campaignDissociateShopifyProduct(campaignId: $campaignId, shopifyProductId: $shopifyProductId) {
      id
      associatedShopifyProducts {
        value {
          id
          shopifyProductId {
            value
          }
          campaign {
            value {
              id
              name {
                value
              }
            }
          }
        }
      }
    }
  }
`;

export default ManageAssociatedProducts;
