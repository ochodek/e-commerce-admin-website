/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import classNames from 'classnames';
import { useRouter } from 'next/router';
import React, { memo, useEffect, useMemo, useState } from 'react';
import uuid from 'react-uuid';
import useSWR, { mutate } from 'swr';

import { LoadingContainer } from '@/components/index';
import { DeleteSvg, EditSvg, EmptyBox, LoadingSvg } from '@/components/svg';
import { Request } from '@/graphql/index';
import {
  CreateAttributeMutation,
  DeleteAttributeMutation,
  UpdateAttributeMutation
} from '@/graphql/mutations/attribute';
import {
  CreateOptionMutation,
  DeleteOptionMutation,
  UpdateOptionMutation
} from '@/graphql/mutations/option';
import { GetProductAttributesQuery } from '@/graphql/queries/attribute';
import { AttributeType, OptionType } from '@/interfaces/index';
import { Notify } from '@/lib/index';

import Add from '../../assets/svg/add.svg';

type Props = { token: string };
interface SWRAttributeType {
  attributes: AttributeType[];
}
interface CreateAttributeType {
  CreateAttribute: { attribute_name: string };
}
interface UpdateAttributeType {
  UpdateAttribute: { attribute_name: string };
}
interface DeleteAttributeType {
  DeleteAttribute: { attribute_name: string };
}
interface CreateOptionType {
  CreateOption: { option_name: string };
}
interface UpdateOptionType {
  UpdateOption: { option_name: string };
}
interface DeleteOptionType {
  DeleteOption: { option_name: string };
}

const Attribute = ({ token }: Props) => {
  const router = useRouter();
  const { query } = router;
  const { pid, attr_uid, opt_uid } = query;

  const ProductVariable = useMemo<{ product_uid: string | string[] }>(() => {
    return { product_uid: pid };
  }, [pid]);

  const { data } = useSWR<SWRAttributeType, Error>(
    pid ? [token, GetProductAttributesQuery, ProductVariable] : null
  );

  const Attributes = data?.attributes;

  const [Loading, setLoading] = useState<boolean>(false);

  const [attribute_name, setAttributeName] = useState<string>('');
  const [OriginalAttributeName, setOriginalAttributeName] =
    useState<string>('');

  const [CurrentOptions, setCurrentOptions] = useState<OptionType[]>([]);
  const [OptionFields, setOptionFields] = useState<OptionType>({
    option_uid: null,
    option_name: null,
    additional_price: 0,
    color_hex: null
  });
  const { option_name, additional_price, color_hex } = OptionFields;

  const MutateAttribute = () => {
    mutate([token, GetProductAttributesQuery, ProductVariable]);
  };

  // Populate Attributes
  useEffect(() => {
    if (attr_uid && Attributes?.length > 0) {
      const Attribute = Attributes?.filter(
        ({ attribute_uid }) => attribute_uid === attr_uid
      );
      if (Attribute[0]) {
        setAttributeName(Attribute[0].attribute_name);
        setOriginalAttributeName(Attribute[0].attribute_name);
        setCurrentOptions(() => Attribute[0]?.options);
      }
    }
  }, [attr_uid, Attributes]);

  const HandleOptionInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const value = target.value;
    const name = target.name;

    setOptionFields((prev) => {
      return {
        ...prev,
        [name]: name === 'additional_price' ? Number(value) : value
      };
    });
  };

  // **** Attribute ****

  const CreateAttribute = async () => {
    if (!pid) {
      Notify(
        `You must submit your product details in order to upload an image.`,
        false
      );
      return;
    }

    if (attribute_name && CurrentOptions.length > 0) {
      setLoading(true);

      await Request({
        token,
        mutation: CreateAttributeMutation,
        variables: {
          product_uid: pid,
          attribute_name,
          options: CurrentOptions
        }
      })
        .then(({ CreateAttribute }: CreateAttributeType) => {
          const attribute_name = CreateAttribute?.attribute_name;

          const message = `🚀 Attribute ${
            attribute_name ?? ''
          } successfully Created`;

          Notify(message, attribute_name);
          setCurrentOptions([]);
          setAttributeName('');
          MutateAttribute();
          Clear({ option: true, attribute: true });
        })
        .catch(({ response }) => {
          const ErrorMessage =
            response?.message ?? response?.errors[0]?.message;
          Notify(ErrorMessage, !response);
        });
    } else {
      Notify('Fields should not be empty!', false);
    }
    setLoading(false);
  };

  const UpdateAttribute = async () => {
    if (attribute_name === '') {
      Notify('Attribute name should not be empty!', false);
      return;
    }
    setLoading(true);

    await Request({
      token,
      mutation: UpdateAttributeMutation,
      variables: {
        attribute_uid: attr_uid,
        attribute_name
      }
    })
      .then(({ UpdateAttribute }: UpdateAttributeType) => {
        const attribute_name = UpdateAttribute?.attribute_name;
        const message = `Attribute ${
          attribute_name ?? ''
        } successfully Updated!`;

        if (attribute_name) {
          Notify(message, attribute_name);
          MutateAttribute();
        }
      })
      .catch(({ response }) => {
        const ErrorMessage = response?.message ?? response?.errors[0]?.message;
        Notify(ErrorMessage, !response);
      });
    setLoading(false);
  };

  const DeleteAttribute = async (_attribute_uid: string) => {
    // make a call to delete attribute && mutate swr

    let Attr_options: OptionType[];
    let Attr: AttributeType[];
    if (_attribute_uid && Attributes?.length > 0) {
      Attr = Attributes?.filter(
        ({ attribute_uid }) => attribute_uid === _attribute_uid
      );
      if (Attr[0]) {
        Attr_options = Attr[0]?.options;
      }
    }

    if (Attr_options?.length > 0) {
      Notify(
        `Please remove all ${Attr[0]?.attribute_name} options first.`,
        false
      );
      return;
    }

    setLoading(true);

    await Request({
      token,
      mutation: DeleteAttributeMutation,
      variables: {
        attribute_uid: _attribute_uid
      }
    })
      .then(({ DeleteAttribute }: DeleteAttributeType) => {
        const attribute_name = DeleteAttribute?.attribute_name;
        const message = `Attribute ${
          attribute_name ?? ''
        } successfully Deleted!`;

        Notify(message, attribute_name);
        // clear
        MutateAttribute();
        Clear({ option: true, attribute: true });
      })
      .catch(({ response }) => {
        const ErrorMessage = response?.message ?? response?.errors[0]?.message;
        Notify(ErrorMessage, !response);
      });
    setLoading(false);
  };

  const EditAttribute = (_attribute_uid: string) => {
    setOptionFields(() => {
      return {
        option_uid: null,
        option_name: null,
        additional_price: 0,
        color_hex: null
      };
    });
    router.push(
      {
        pathname: '/product/factory',
        query: { ...query, attr_uid: _attribute_uid }
      },
      undefined,
      { scroll: false }
    );
  };

  // **** Option ****

  const CreateOption = async () => {
    if (option_name) {
      const _uuid = uuid();

      if (attr_uid) {
        // option Create api api call + mutate
        setLoading(true);

        await Request({
          token,
          mutation: CreateOptionMutation,
          variables: {
            attribute_uid: attr_uid,
            option_name,
            additional_price,
            color_hex
          }
        })
          .then(({ CreateOption }: CreateOptionType) => {
            const option_name = CreateOption?.option_name;
            const message = `Option ${option_name ?? ''} successfully Created!`;

            if (option_name) {
              Notify(message, option_name);
              MutateAttribute();
            }
          })
          .catch(({ response }) => {
            const ErrorMessage =
              response?.message ?? response?.errors[0]?.message;
            Notify(ErrorMessage, !response);
          });
        setLoading(false);
      } else {
        // create mode for new attribute
        setCurrentOptions((prev) => [
          ...prev,
          {
            option_uid: _uuid,
            option_name,
            additional_price,
            color_hex
          }
        ]);
      }
      // clear
      Clear({ option: true });
    }
  };

  const UpdateOption = async () => {
    if (attr_uid && opt_uid) {
      // option update api api call + mutate
      setLoading(true);

      await Request({
        token,
        mutation: UpdateOptionMutation,
        variables: {
          option_uid: opt_uid,
          option_name,
          additional_price,
          color_hex
        }
      })
        .then(({ UpdateOption }: UpdateOptionType) => {
          const option_name = UpdateOption?.option_name;
          const message = `Option ${option_name ?? ''} successfully Updated!`;

          if (option_name) {
            Notify(message, option_name);
            MutateAttribute();
          }
        })
        .catch(({ response }) => {
          const ErrorMessage =
            response?.message ?? response?.errors[0]?.message;
          Notify(ErrorMessage, !response);
        });
      setLoading(false);
    } else {
      // update option from useState
      setCurrentOptions((prev) => [
        ...prev.map((option) => {
          if (option?.option_uid === opt_uid) {
            option.option_name = option_name;
            option.additional_price = additional_price;
            option.color_hex = color_hex;
          }
          return option;
        })
      ]);
    }

    // clear
    Clear({ option: true });
  };

  const DeleteOption = async (_option_uid: string) => {
    if (attr_uid && _option_uid) {
      setLoading(true);

      await Request({
        token,
        mutation: DeleteOptionMutation,
        variables: {
          option_uid: _option_uid
        }
      })
        .then(({ DeleteOption }: DeleteOptionType) => {
          const option_name = DeleteOption?.option_name;
          const message = `Option ${option_name ?? ''} successfully deleted!`;

          if (option_name) {
            Notify(message, option_name);
            MutateAttribute();
          }
        })
        .catch(({ response }) => {
          const ErrorMessage =
            response?.message ?? response?.errors[0]?.message;
          Notify(ErrorMessage, !response);
        });
      setLoading(false);
    } else if (!attr_uid && _option_uid) {
      setCurrentOptions((prev) => {
        return prev?.filter(({ option_uid }) => option_uid !== _option_uid);
      });
    }
    Clear({ option: true });
  };

  const EditOption = (_option_uid: string) => {
    if (_option_uid) {
      const selectedOption = CurrentOptions?.filter(
        ({ option_uid }) => option_uid === _option_uid
      )[0];

      setOptionFields({
        option_uid: selectedOption?.option_uid,
        option_name: selectedOption?.option_name,
        additional_price: selectedOption?.additional_price,
        color_hex: selectedOption?.color_hex
      });
    }

    router.push(
      {
        pathname: '/product/factory',
        query: { ...query, opt_uid: _option_uid }
      },
      undefined,
      { scroll: false }
    );
  };

  // **** Clear ****
  const Clear = ({ option = false, attribute = false }) => {
    let _query = { ...query };
    if (option) {
      delete _query['opt_uid'];
      setOptionFields(() => {
        return {
          option_uid: null,
          option_name: null,
          additional_price: 0,
          color_hex: null
        };
      });
    }
    if (attribute) {
      delete _query['attr_uid'];
      setAttributeName('');
      setCurrentOptions([]);
    }

    if (attr_uid || opt_uid) {
      router.push(
        {
          pathname: '/product/factory',
          query: _query
        },
        undefined,
        { scroll: false }
      );
    }
  };

  const attributeNameHasChange = useMemo<boolean>(() => {
    if (attribute_name && attribute_name !== OriginalAttributeName) return true;
    return false;
  }, [attribute_name, OriginalAttributeName]);

  return (
    <form className="m-auto">
      {Loading && <LoadingContainer />}
      <div
        style={{
          borderTop: '0',
          borderTopLeftRadius: '0',
          borderTopRightRadius: '0'
        }}
        className="shadow overflow-hidden md:rounded-lg card-container rounded-none"
      >
        <div className="relative flex justify-center items-center px-4 py-3 text-gray-800 bg-gray-100 text-right sm:px-6">
          <span className="uppercase text-sm">Create Product Attributes</span>
          <span
            className={classNames(
              'absolute',
              'font-medium',
              'right-0',
              'p-1',
              'rounded-full',
              'mr-3',
              'text-xs',
              'border',
              'border-solid',
              {
                'text-green-800': !attr_uid,
                'bg-green-300': !attr_uid,
                'border-green-500': !attr_uid,
                'text-yellow-800': attr_uid,
                'bg-yellow-300': attr_uid,
                'border-yellow-500': attr_uid
              }
            )}
          >
            {attr_uid ? 'Edit Mode' : 'Create Mode'}
          </span>
        </div>
        <div className="px-4 py-5 bg-white sm:p-6">
          <div className="block">
            {/* ******************* Attributes Showcase ******************* */}
            <span className="block text-sm font-medium text-gray-700 mb-1">
              Available Attributes
            </span>
            <div className="relative mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md w-full">
              {pid && !Attributes ? (
                <span className="text-gray-500 self-center justify-self-center">
                  <LoadingSvg width={30} height={30} />
                </span>
              ) : (
                (!Attributes || Attributes?.length === 0) && (
                  <span className="text-gray-500 self-center justify-self-center">
                    <EmptyBox width={30} height={30} />
                  </span>
                )
              )}
              {Attributes?.map(({ attribute_uid, attribute_name }) => {
                return (
                  <div
                    key={attribute_uid}
                    className="relative card-container rounded m-2"
                  >
                    <div className="m-2">
                      <span>{attribute_name}</span>
                    </div>
                    <div className="flex justify-center rounded-b border-gray-300 border-solid items-center">
                      <div
                        role="button"
                        className="rounded-bl cursor-pointer text-xs bg-red-400 w-full p-1 text-center hover:bg-red-500 text-white"
                        onClick={() => DeleteAttribute(attribute_uid)}
                      >
                        <DeleteSvg width={15} height={15} />
                      </div>
                      <div
                        style={{
                          height: '100%',
                          width: '2px',
                          background: 'gray'
                        }}
                      ></div>
                      <div
                        role="button"
                        className="rounded-br cursor-pointer text-xs bg-green-400 w-full p-1 text-center hover:bg-green-500 text-white"
                        onClick={() => EditAttribute(attribute_uid)}
                      >
                        <EditSvg fill="#fff" width={15} height={15} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {pid && Attributes && attr_uid && (
                <div className="flex justify-center items-center">
                  <div
                    onClick={() => Clear({ option: true, attribute: true })}
                    role="button"
                    style={{ width: '30px', height: '30px' }}
                    className="bg-green-400 hover:bg-green-500 rounded-full px-2 py-1 cursor-pointer flex justify-center items-center"
                  >
                    <Add width={18} height={18} />
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 mb-5 border-t-2 border-solid border-gray-200 pt-2"></div>
            <div className="block">
              {/* ******************* attribute_name ******************* */}
              <div className="mb-4">
                <label
                  htmlFor="attribute_name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Attribute Name
                  <span style={{ color: 'red' }} title="required">
                    *
                  </span>
                </label>
                <input
                  required
                  type="text"
                  id="attribute_name"
                  value={attribute_name}
                  onChange={(e) => setAttributeName(e.target.value)}
                  className="shadow-sm border-2 focus:border-indigo-500 mt-1 
                                      block w-full border-solid border-gray-300 rounded-md p-1"
                  placeholder="attribute"
                />
                <p className="mt-2 text-xs text-gray-500">
                  e.g: color or size attribute. (required)
                </p>
                {attr_uid && attributeNameHasChange && (
                  <div className="px-4 py-3 sm:px-6 text-right">
                    <div
                      role="button"
                      onClick={UpdateAttribute}
                      className="text-sm cursor-pointer bg-green-600 focus:outline-none text-white rounded-md font-medium inline-flex justify-center py-2 px-4 border border-transparent shadow-sm"
                    >
                      Save Attribute Name
                    </div>
                  </div>
                )}
              </div>
              <span className="block text-sm font-medium text-gray-700 mb-1">
                Create Attribute Options
              </span>
              <div className="block border border-solid border-gray-300 p-2 rounded">
                {/* ******************* option_name ******************* */}
                <div className="mb-4">
                  <label
                    htmlFor="option_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Option Name
                    <span style={{ color: 'red' }} title="required">
                      *
                    </span>
                  </label>
                  <input
                    required
                    type="text"
                    id="option_name"
                    name="option_name"
                    value={option_name ?? ''}
                    onChange={HandleOptionInputChange}
                    placeholder="option"
                    className="shadow-sm border-2 focus:border-indigo-500 mt-1 
                                      block w-full border-solid border-gray-300 rounded-md p-1"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    e.g: red or XL option. (required)
                  </p>
                </div>
                {/* ******************* additional_price ******************* */}
                <div className="mb-4">
                  <label
                    htmlFor="additional_price"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Additional Pricing (USD)
                  </label>
                  <input
                    type="number"
                    id="additional_price"
                    name="additional_price"
                    onWheel={(e) => e.currentTarget.blur()}
                    value={additional_price}
                    min={0}
                    step={0.01}
                    onChange={HandleOptionInputChange}
                    className="shadow-sm border-2 focus:border-indigo-500 mt-1 
                                      block w-full border-solid border-gray-300 rounded-md p-1"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    This option will allow you to increase the price on top of
                    the original base price. (default is $0)
                  </p>
                </div>

                {/* ******************* color_hex ******************* */}
                <div className="mb-4">
                  <label
                    htmlFor="color_hex"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Color Hex
                  </label>
                  <input
                    type="text"
                    id="color_hex"
                    name="color_hex"
                    value={color_hex ?? ''}
                    onChange={HandleOptionInputChange}
                    placeholder="#800080"
                    className="shadow-sm border-2 focus:border-indigo-500 mt-1 
                                      block w-full border-solid border-gray-300 rounded-md p-1"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Add a color Hex if your option is a color name. (not
                    required)
                  </p>
                </div>
                {/* ******************* Add Option ******************* */}
                {opt_uid ? (
                  <div className="px-4 py-3 text-right sm:px-6">
                    <div
                      onClick={UpdateOption}
                      role="button"
                      className="text-sm cursor-pointer bg-green-500 hover:bg-green-400 focus:outline-none text-white rounded-md font-medium inline-flex justify-center py-2 px-4 border border-transparent shadow-sm"
                    >
                      Save Option
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 text-right sm:px-6">
                    <div
                      onClick={CreateOption}
                      role="button"
                      className="text-sm cursor-pointer bg-blue-500 hover:bg-blue-400 focus:outline-none text-white rounded-md font-medium inline-flex justify-center py-2 px-4 border border-transparent shadow-sm"
                    >
                      Add Option
                    </div>
                  </div>
                )}
                {/* ******************* Option Showcase ******************* */}
                <span className="block text-sm font-medium text-gray-700 mb-1 capitalize">{`${attribute_name} Options`}</span>
                <div className="relative mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md w-full">
                  {CurrentOptions.length === 0 && (
                    <span className="text-gray-500 self-center justify-self-center">
                      <EmptyBox width={30} height={30} />
                    </span>
                  )}
                  {CurrentOptions?.map(({ option_uid, option_name }) => {
                    return (
                      <div
                        key={option_uid}
                        className="relative card-container rounded m-2"
                      >
                        <div className="m-2">
                          <span>{option_name}</span>
                        </div>
                        <div className="flex justify-center rounded-b border-gray-300 border-solid items-center">
                          <div
                            role="button"
                            className="rounded-br cursor-pointer text-xs bg-red-400 w-full p-1 text-center hover:bg-red-500 text-white"
                            onClick={() => DeleteOption(option_uid)}
                          >
                            <DeleteSvg width={15} height={15} />
                          </div>
                          <div
                            style={{
                              height: '100%',
                              width: '2px',
                              background: 'gray'
                            }}
                          ></div>
                          <div
                            role="button"
                            className="rounded-br cursor-pointer text-xs bg-green-400 w-full p-1 text-center hover:bg-green-500 text-white"
                            onClick={() => EditOption(option_uid)}
                          >
                            <EditSvg fill="#fff" width={15} height={15} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* ******************* submit attribute ******************* */}
            {!attr_uid && (
              <div className="px-4 py-3 mt-6 sm:px-6">
                <div
                  role="button"
                  onClick={CreateAttribute}
                  className="text-sm w-full cursor-pointer bg-green-600 focus:outline-none text-white rounded-md font-medium inline-flex justify-center py-2 px-4 border border-transparent shadow-sm"
                >
                  Add Attribute
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default memo(Attribute);
