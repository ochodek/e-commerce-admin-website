import { gql } from 'graphql-request';

export const GetCategoriesQuery = gql`
  {
    Categories {
      category_uid
      category_name
      display_order
    }
  }
`;

export const GetProductAttributesQuery = gql`
  query attributes($product_uid: ID!) {
    attributes(product_uid: $product_uid) {
      attribute_uid
      product_uid
      attribute_name
      options {
        option_uid
        attribute_uid
        option_name
        additional_price
        color_hex
      }
    }
  }
`;
