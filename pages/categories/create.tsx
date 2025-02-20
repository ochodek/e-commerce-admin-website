import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useRef, useState } from 'react';

import { LoadingSvg } from '@/components/svg';
import { UserStoreContext } from '@/context/UserStore';
import { Request } from '@/graphql/index';
import { CreateCategoryMutation } from '@/graphql/mutations/index';
import type { AuthPageProps } from '@/interfaces/index';
import { Logs } from '@/lib/index';
import { Notify } from '@/lib/Notify';
import { getAppCookies, verifyToken } from '@/middleware/utils';

import ArrowLeft from '../../assets/svg/arrow-left.svg';

interface CreateCategoryType {
  CreateCategory: {
    category_name: string;
  };
}

const NewCategory = ({ token, userInfo }: AuthPageProps) => {
  const router = useRouter();

  const CategoryNameRef = useRef<HTMLInputElement>(null);
  const CategoryDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const IsActiveRef = useRef<HTMLInputElement>(null);

  const { setUserStore } = useContext(UserStoreContext);

  const [Loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (userInfo) {
      setUserStore(userInfo);
    } else {
      router.push('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUserStore, userInfo]);

  const SubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const category_name = CategoryNameRef.current.value;
    const category_description = CategoryDescriptionRef.current.value;
    const is_active = IsActiveRef.current.checked;

    try {
      if (category_name && category_description && !Loading) {
        setLoading(true);

        await Request({
          token,
          mutation: CreateCategoryMutation,
          variables: {
            category_name,
            category_description,
            is_active
          }
        })
          .then(({ CreateCategory }: CreateCategoryType) => {
            const CategoryName = CreateCategory?.category_name;

            if (CategoryName) {
              Notify(
                `🚀 Category '${CategoryName}' successfully created!`,
                CategoryName
              );

              CategoryNameRef.current.value = '';
              CategoryDescriptionRef.current.value = '';
              IsActiveRef.current.checked = true;
            }
          })
          .catch(({ response }) => {
            const ErrorMessage =
              response?.message ?? response?.errors[0]?.message;
            Notify(ErrorMessage, !response);
          });
      } else {
        Notify('Fields should not be empty!', false);
      }
    } catch (error) {
      Logs({ message: 'SubmitForm /create', error });
      Notify('Ops something went wrong.', false);
    }
    setLoading(false);
  };

  return (
    <div className="form-container">
      <div className="form-wrapper">
        <section className="flex justify-between items-center md:ml-0 ml-2 mb-3">
          <button
            className="flex justify-center items-center 
          bg-green-400 py-2 px-3  rounded-sm hover:shadow-inner shadow-lg 
          hover:bg-green-500"
            onClick={() => router.back()}
          >
            <div>
              <ArrowLeft width={20} height={20} />
            </div>
            <span className="px-1 text-base text-white">Back</span>
          </button>
        </section>
        <form className="m-auto relative" onSubmit={SubmitForm}>
          {Loading && (
            <div
              className="absolute bg-black bg-opacity-10 rounded-lg inset-0 flex 
          justify-center items-center"
            >
              <LoadingSvg width={80} height={80} />
            </div>
          )}
          <div className="shadow overflow-hidden md:rounded-lg card-container rounded-none">
            <div
              className="relative flex justify-center items-center px-4 py-3 text-gray-800 
          bg-gray-50 text-right sm:px-6"
            >
              <span className="uppercase text-sm">Create a new category</span>
              <span className="absolute font-medium right-0 p-1 rounded-full mr-3 text-xs border border-solid text-green-800 bg-green-300 border-green-500">
                Create Mode
              </span>
            </div>
            <div className="px-4 py-5 bg-white sm:p-6">
              <div className="block">
                {/* ********** sub_category_name ********** */}
                <div className="mb-4">
                  <label
                    htmlFor="sub_category_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category name
                  </label>
                  <input
                    type="text"
                    name="sub_category_name"
                    id="sub_category_name"
                    ref={CategoryNameRef}
                    autoComplete="given-name"
                    className="mt-1 focus:border-indigo-500 block w-full 
                                  shadow-sm border-2 border-solid border-gray-300 rounded-md p-1"
                  />
                </div>
                {/* ********** sub_category_description ********** */}
                <div className="mb-4">
                  <label
                    htmlFor="sub_category_description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="sub_category_description"
                      name="sub_category_description"
                      rows={4}
                      ref={CategoryDescriptionRef}
                      className="shadow-sm border-2 focus:border-indigo-500 mt-1 
                                      block w-full border-solid border-gray-300 rounded-md p-1"
                      placeholder="This category is awesome"
                      defaultValue={''}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Brief description about the category (important for SEO).
                  </p>
                </div>
                {/* ********** is_active ********** */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      className="h-4 w-4"
                      ref={IsActiveRef}
                      defaultChecked={true}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="is_active"
                      className="font-medium text-gray-700"
                    >
                      Publish
                    </label>
                    <p className="text-gray-500 text-xs">
                      Publish a category and the products under it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent 
              shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
              focus:ring-indigo-500"
              >
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { token }: { token: string } = getAppCookies(context);
    const userInfo = verifyToken(token);

    if (!userInfo) {
      return {
        redirect: {
          permanent: false,
          destination: '/'
        }
      };
    }

    return {
      props: {
        token,
        userInfo
      }
    };
  } catch (error) {
    console.log(`getServerSideProps error :>`, error);
    return {
      props: {
        error
      }
    };
  }
};

export default NewCategory;
