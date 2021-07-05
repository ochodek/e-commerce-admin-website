/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import classNames from 'classnames';
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import React, { useContext, useEffect, useReducer, useRef, useState } from 'react';
import ImageUploading from 'react-images-uploading';
import { Tab, TabList, TabPanel } from 'react-tabs';
import { Slide, toast, ToastContainer } from 'react-toastify';
import useSWR from 'swr';

import { LoadingSvg } from '@/components/svg';
import { UserStoreContext } from '@/context/UserStore';
import { Request } from '@/graphql/index';
import { CreateProductMutation } from '@/graphql/mutations/product';
import { GetCategoriesQuery } from '@/graphql/queries/category';
import { getAppCookies, verifyToken } from '@/middleware/utils';

import Add from '../../assets/svg/add.svg';
import ArrowLeft from '../../assets/svg/arrow-left.svg';

const Tabs = dynamic(import('react-tabs').then(mod => mod.Tabs), { ssr: false });

const initialState = {
  category_uid: '',
  account_uid: '',
  quiz_description: '',
  title: '',
  price: 0,
  discount: 0,
  shipping_price: 0,
  warehouse_location: '',
  product_description: '',
  short_description: '',
  quantity: 0,
  product_weight: '',
  available_sizes: '',
  available_colors: '',
  size: '',
  color: '',
  is_new: true,
  _stateReadyToSubmit: false
};

function reducer(state, action) {
  switch (action.type) {
    case 'insert':
      return {
        ...state,
        [action.field]: action.value
      };
    case 'reset':
      return {
        ...initialState
      };
    default:
      return state;
  }
}

const NewProduct = ({ token, userInfo }) => {

  const router = useRouter();

  const [, setUserStore] = useContext(UserStoreContext);
  const [ProductState, dispatchProduct] = useReducer(reducer, initialState);

  const [ThumbnailUrl, setThumbnailUrl] = useState(null);
  const [ImagesUrl, setImagesUrl] = useState([]);

  const [images, setImages] = useState([]);
  const [ThumbnailImage, setThumbnailImage] = useState([]);

  const Notify = (Message, success) => {
    const Options = {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined
    };
    if (success) {
      toast.success(Message, Options);
    } else {
      toast.error(Message, Options);
    }
  };


  useEffect(() => {
    if (userInfo) {
      const { account_uid, email, first_name, last_name, privileges } = userInfo;
      setUserStore((prev) => {
        return { ...prev, account_uid, email, first_name, last_name, privileges };
      });
      // ------
      dispatchProduct({
        type: 'insert',
        value: account_uid,
        field: 'account_uid'
      });
    } else {
      router.push('/')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUserStore, userInfo]);


  return (
    <div className="form-container">
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        className="text-sm"
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Slide}
      />
      <div className="form-wrapper">
        <section className="flex justify-between items-center md:ml-0 ml-2 mb-9">
          <button
            className="flex justify-center items-center 
            bg-green-400 py-2 px-3  rounded-sm hover:shadow-inner shadow-lg hover:bg-green-500"
            onClick={() => router.back()}
          >
            <div>
              <ArrowLeft width={20} height={20} />
            </div>
            <span className="px-1 text-base text-white">Back</span>
          </button>
        </section>
        <Tabs>
          <TabList>
            <Tab>Product Details</Tab>
            <Tab>Products Gallery</Tab>
          </TabList>
          <TabPanel>
            <Form
              ProductState={ProductState}
              dispatchProduct={dispatchProduct}
              token={token}
              Notify={Notify}
            />
          </TabPanel>
          <TabPanel>
            <Tabs forceRenderTabPanel>
              <div className="bg-white pt-2">
                <TabList>
                  <Tab>Drag & Drop</Tab>
                  <Tab>Upload By URL</Tab>
                </TabList>
              </div>
              <TabPanel>
                <GalleryUploadByDnD
                  token={token}
                  images={images}
                  setImages={setImages}
                  ThumbnailImage={ThumbnailImage}
                  setThumbnailImage={setThumbnailImage}
                  Notify={Notify}
                />
              </TabPanel>
              <TabPanel>
                <GalleryUploadByUrl
                  token={token}
                  ThumbnailUrl={ThumbnailUrl}
                  setThumbnailUrl={setThumbnailUrl}
                  ImagesUrl={ImagesUrl}
                  setImagesUrl={setImagesUrl}
                  Notify={Notify}
                />
              </TabPanel>
            </Tabs>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
};


const HostUrl =
  process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001';


const Form = ({ ProductState, dispatchProduct, token, Notify }) => {

  const router = useRouter();
  const { cid } = router.query;

  const { data } = useSWR([token, GetCategoriesQuery]);
  const [Loading, setLoading] = useState(false);

  const {
    category_uid,
    account_uid,
    title,
    price,
    discount,
    shipping_price,
    warehouse_location,
    product_description,
    short_description,
    quantity,
    product_weight,
    available_sizes,
    available_colors,
    size,
    color,
    is_new
  } = ProductState

  console.log(`data`, { data, cid });

  useEffect(() => {
    const Default_cid = data?.Categories[0]?.category_uid
    if (cid || Default_cid) {
      dispatchProduct({
        type: 'insert',
        value: cid ?? Default_cid,
        field: 'category_uid'
      });
    }
  }, [cid, data, dispatchProduct]);

  const HandleInputChange = (e) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    dispatchProduct({
      type: 'insert',
      value: target.type === 'number' ? Number(value) : value,
      field: name
    });
  };

  const SubmitProductDetails = async (e) => {
    e.preventDefault();

    try {
      if (title && price && product_description && !Loading) {
        setLoading(true);

        await Request({
          token,
          mutation: CreateProductMutation,
          variables: {
            category_uid,
            account_uid,
            title,
            price,
            discount,
            shipping_price,
            warehouse_location,
            product_description,
            short_description,
            quantity,
            product_weight,
            available_sizes,
            available_colors,
            size,
            color,
            is_new
          }
        })
          .then(({ CreateProduct }) => {
            const CategoryId = CreateProduct?.product_uid;

            Notify(`🚀 Product successfully created`, CreateProduct);

            // if (CreateProduct) {
            //   dispatchQuiz({
            //     type: 'reset'
            //   });
            // }
          })
          .catch(({ response }) => {
            const ErrorMessage =
              response?.message ?? response?.errors[0]?.message;
            Notify(ErrorMessage, !response);
            // LOGS
          });
      } else {
        Notify('Fields should not be empty!', false);
      }
    } catch (err) {
      console.log(`Error =>`, err);
      Notify('Ops something went wrong.', false);
      // LOGS
    }
    setLoading(false);
  };

  return (
    <form className="m-auto" onSubmit={SubmitProductDetails}>
      {Loading && (
        <div
          className="absolute bg-black bg-opacity-10 rounded-lg inset-0 flex 
            justify-center items-center"
        >
          <LoadingSvg width={80} height={80} />
        </div>
      )}
      <div style={{ borderTop: '0', borderTopLeftRadius: '0', borderTopRightRadius: '0' }} className="shadow overflow-hidden md:rounded-lg card-container rounded-none">
        <div className="flex justify-center items-center px-4 py-3 text-gray-800 bg-gray-50 text-right sm:px-6">
          <span className="uppercase text-sm">Create a new Product</span>
        </div>
        <div className="px-4 py-5 bg-white sm:p-6">
          <div className="block">
            {/* ******************* title ******************* */}
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title
                <span style={{ color: 'red' }} title="required">
                  *
                </span>
              </label>
              <textarea
                required
                id="title"
                name="title"
                value={title}
                onChange={HandleInputChange}
                rows={3}
                className="shadow-sm border-2 focus:border-indigo-500 mt-1 
                                        block w-full border-solid border-gray-300 rounded-md p-1"
                placeholder="My product"
              />
            </div>
            {/* ******************* price ******************* */}
            <div className="mb-4">
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700"
              >
                Price <span className="text-sm text-gray-500">(USD)</span>
              </label>
              <input
                required
                type="number"
                name="price"
                id="price"
                min={0}
                value={price}
                onChange={HandleInputChange}
                className="mt-1 focus:border-indigo-500 block w-full 
                                    shadow-sm border-2 border-solid border-gray-300 rounded-md p-1"
              />
            </div>
            {/* ******************* discount ******************* */}
            <div className="mb-4">
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700"
              >
                Discount
                <span className="text-sm text-gray-500">(%)</span>
              </label>
              <input
                type="number"
                name="discount"
                max={100}
                min={0}
                id="discount"
                value={discount}
                onChange={HandleInputChange}
                className="mt-1 focus:border-indigo-500 block w-full 
                                    shadow-sm border-2 border-solid border-gray-300 rounded-md p-1"
              />
              <p className="mt-2 text-xs text-gray-500">
                Product discount percentage number.
              </p>
            </div>
            {/* ******************* shipping_price ******************* */}
            <div className="mb-4">
              <label
                htmlFor="shipping_price"
                className="block text-sm font-medium text-gray-700"
              >
                Shipping Price
                <span className="text-sm text-gray-500">(USD)</span>
              </label>
              <input
                type="number"
                name="shipping_price"
                id="shipping_price"
                value={shipping_price}
                onChange={HandleInputChange}
                className="mt-1 focus:border-indigo-500 block w-full 
                                    shadow-sm border-2 border-solid border-gray-300 rounded-md p-1"
              />
            </div>
            {/* ******************* warehouse_location ******************* */}
            <div className="mb-4">
              <label
                htmlFor="warehouse_location"
                className="block text-sm font-medium text-gray-700"
              >
                Warehouse Location
              </label>
              <textarea
                id="warehouse_location"
                name="warehouse_location"
                rows={3}
                value={warehouse_location}
                onChange={HandleInputChange}
                className="shadow-sm border-2 focus:border-indigo-500 mt-1 
                                        block w-full border-solid border-gray-300 rounded-md p-1"
                placeholder="My street"
              />
            </div>
            {/* ******************* stock_count ******************* */}
            <div className="mb-4">
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700"
              >
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                value={quantity}
                onChange={HandleInputChange}
                className="mt-1 focus:border-indigo-500 block w-full 
                                    shadow-sm border-2 border-solid border-gray-300 rounded-md p-1"
              />
            </div>
            {/* ******************* product_weight ******************* */}
            <div className="mb-4">
              <label
                htmlFor="product_weight"
                className="block text-sm font-medium text-gray-700"
              >
                Product Weight
                <span className="text-sm text-gray-500">(g)</span>
              </label>
              <input
                type="number"
                name="product_weight"
                id="product_weight"
                value={product_weight}
                onChange={HandleInputChange}
                className="mt-1 focus:border-indigo-500 block w-full 
                                    shadow-sm border-2 border-solid border-gray-300 rounded-md p-1"
              />
              <p className="mt-2 text-xs text-gray-500">
                Product weight in Gram.
              </p>
            </div>
            {/* ******************* product_description ******************* */}
            <div className="mb-4">
              <label
                htmlFor="product_description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
                <span style={{ color: 'red' }} title="required">
                  *
                </span>
              </label>
              <div className="mt-1">
                <textarea
                  required
                  id="product_description"
                  name="product_description"
                  rows={5}
                  value={product_description}
                  onChange={HandleInputChange}
                  className="shadow-sm border-2 focus:border-indigo-500 mt-1 
                                        block w-full border-solid border-gray-300 rounded-md p-1"
                  placeholder="This product is awesome"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Brief description about the product (product details).
              </p>
            </div>
            {/* ******************* short_description ******************* */}
            <div className="mb-4">
              <label
                htmlFor="short_description"
                className="block text-sm font-medium text-gray-700"
              >
                Short Description
                <span style={{ color: 'red' }} title="required">
                  *
                </span>
              </label>
              <div className="mt-1">
                <textarea
                  required
                  id="short_description"
                  name="short_description"
                  rows={3}
                  value={short_description}
                  onChange={HandleInputChange}
                  className="shadow-sm border-2 focus:border-indigo-500 mt-1 
                                        block w-full border-solid border-gray-300 rounded-md p-1"
                  placeholder="This product is awesome"
                />
              </div>
              <p className="flex flex-col mt-2 text-xs text-gray-500">
                <span>
                  Short description about the product (important for SEO).
                </span>
                <span className="text-green-600">{`Must be less than 160 characters | ${100}/160`}</span>
              </p>
            </div>
            {/* ******************* category ******************* */}
            <div className="mt-3 mb-5 border-t-2 border-solid border-gray-200 pt-2">
              <label
                htmlFor="category_uid"
                className="block text-sm font-medium text-gray-700"
              >
                Category
              </label>
              {/* eslint-disable-next-line jsx-a11y/no-onchange */}
              <select
                id="category_uid"
                name="category_uid"
                value={category_uid}
                onChange={HandleInputChange}
                className="mt-1 block py-2 px-3 border border-solid border-gray-300 bg-white 
                                    rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 
                                    focus:border-indigo-500 sm:text-sm w-2/4"
              >
                {data?.Categories?.map(
                  ({ category_uid, category_name }) => {
                    return (
                      <option key={category_uid} value={category_uid}>
                        {category_name}
                      </option>
                    );
                  }
                )}
                {/* <option value='368cb456-6c4b-4aac-8aab-33da7701e483'>OWO</option> */}
              </select>
              <p className="flex items-center mt-1 text-xs text-gray-500">
                <span>
                  Select a category where this product belongs too.
                  (require)
                </span>
                <span className="text-red-500">*</span>
              </p>
            </div>
            {/* ******************* available_sizes ******************* */}
            <div className="mb-4">
              <label
                htmlFor="available_sizes"
                className="block text-sm font-medium text-gray-700"
              >
                Available Sizes
              </label>
              <textarea
                id="available_sizes"
                name="available_sizes"
                rows={2}
                value={available_sizes}
                onChange={HandleInputChange}
                placeholder="e.g: S, M, L, XL, XXL, XXXL, ...etc"
                className="shadow-sm border-2 focus:border-indigo-500 mt-1 
                                        block w-full border-solid border-gray-300 rounded-md p-1"
              />
              <p className="flex items-center mt-1 text-xs text-gray-500">
                <span>
                  Add multiple sizes available for this product, separate
                  sizes by comma(,) (not required).
                </span>
              </p>
            </div>
            {/* ******************* size ******************* */}
            <div className="mb-4">
              <label
                htmlFor="size"
                className="block text-sm font-medium text-gray-700"
              >
                Size
              </label>
              <input
                type="text"
                name="size"
                id="size"
                value={size}
                onChange={HandleInputChange}
                className="mt-1 focus:border-indigo-500 block w-full 
                                    shadow-sm border-2 border-solid border-gray-300 rounded-md p-1"
              />
              <p className="flex flex-col mt-2 text-xs text-gray-500">
                <span>Product size (not required).</span>
              </p>
            </div>
            {/* ******************* available_colors ******************* */}
            <div className="mb-4">
              <label
                htmlFor="available_colors"
                className="block text-sm font-medium text-gray-700"
              >
                Available Colors
              </label>
              <textarea
                id="available_colors"
                name="available_colors"
                rows={2}
                value={available_colors}
                onChange={HandleInputChange}
                className="shadow-sm border-2 focus:border-indigo-500 mt-1 
                                        block w-full border-solid border-gray-300 rounded-md p-1"
                placeholder="e.g: black, red, orange, green, ...etc"
              />
              <p className="flex items-center mt-1 text-xs text-gray-500">
                <span>
                  Add multiple colors available for this product, separate
                  colors by comma(,) (not required).
                </span>
              </p>
            </div>
            {/* ******************* color ******************* */}
            <div className="mb-4">
              <label
                htmlFor="size"
                className="block text-sm font-medium text-gray-700"
              >
                Color
              </label>
              <input
                type="text"
                name="color"
                id="color"
                value={color}
                onChange={HandleInputChange}
                className="mt-1 focus:border-indigo-500 block w-full 
                                    shadow-sm border-2 border-solid border-gray-300 rounded-md p-1"
              />
              <p className="flex flex-col mt-2 text-xs text-gray-500">
                <span>Product color (not required).</span>
              </p>
            </div>
            {/* ******************* is_new ******************* */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="is_new"
                  name="is_new"
                  value={is_new}
                  checked={is_new}
                  onChange={HandleInputChange}
                  type="checkbox"
                  className="h-4 w-4"
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="is_new"
                  className="font-medium text-gray-700"
                >
                  Unused
                </label>
                <p className="text-gray-500 mt-0 text-xs">
                  New product or used product.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* ******************* submit ******************* */}
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Submit
          </button>
        </div>
      </div>
    </form>
  )
}

const GalleryUploadByUrl = ({ token, ThumbnailUrl, setThumbnailUrl, ImagesUrl, setImagesUrl, Notify }) => {

  const ThumbnailUrlRef = useRef(null);
  const ImageUrlRef = useRef(null);

  const [Loading, setLoading] = useState(false);

  const AddThumbnail = () => {
    const url = ThumbnailUrlRef.current.value
    if (url) {
      setThumbnailUrl(() => url)
      ThumbnailUrlRef.current.value = null
    }
  }

  const AddImagesUrl = () => {
    const url = ImageUrlRef.current.value
    console.log(`url`, url)
    if (url) {
      setImagesUrl((prev) => [...prev, url]);
      ImageUrlRef.current.value = null
    }
  }

  const SubmitThumbnail = (e) => {
    e.preventDefault();
    setLoading(true)
    setLoading(false)
  }

  const SubmitImages = (e) => {
    e.preventDefault();
    setLoading(true)
    setLoading(false)
  }


  return (
    <form className="m-auto">
      {Loading && (
        <div
          className="absolute bg-black bg-opacity-10 rounded-lg inset-0 flex justify-center items-center">
          <LoadingSvg width={80} height={80} />
        </div>
      )}
      <div style={{ borderTop: '0', borderTopLeftRadius: '0', borderTopRightRadius: '0' }}
        className="shadow overflow-hidden md:rounded-lg card-container rounded-none">
        <div className="flex justify-center items-center px-4 py-3 text-gray-800 bg-gray-50 text-right sm:px-6">
          <span className="uppercase text-sm">Add Product Images</span>
        </div>
        <div className="px-4 py-5 bg-white sm:p-6">
          <div className="block">
            {/* ******************* thumbnail ******************* */}
            <div className="">
              <div className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail Image
              </div>
              {/* -- Thumbnail URL -- */}
              <div>
                <input
                  type="text"
                  ref={ThumbnailUrlRef}
                  placeholder="www.example.com/img.png"
                  className="mt-1 focus:border-indigo-500 block w-full 
                        shadow-sm border-2 border-solid border-gray-300 rounded-md p-1"
                />
              </div>
              <div
                role="button"
                onClick={AddThumbnail}
                className="m-1 mb-4 flex justify-end"
              >
                <span className="bg-green-400 rounded-sm px-2 py-1 text-white cursor-pointer">
                  <Add width={18} height={18} />
                </span>
              </div>
              {/* -- Thumbnail Showcase -- */}
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center w-full">
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 rounded-md">
                    <div
                      className={classNames(
                        'w-full',
                        'h-full',
                        'rounded-md'
                      )}
                    >
                      <div className="flex justify-center items-center flex-col mb-3">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="text-xs text-gray-500">
                          (make sur Thumbnail are high-resolution)
                        </p>
                      </div>
                      <div className="flex justify-center flex-wrap items-center">
                        {ThumbnailUrl && <div

                          className="card-container rounded m-2"
                        >
                          <div style={{ width: '100px' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              className="rounded-t"
                              src={ThumbnailUrl}
                              alt=""
                              width="100"
                              height="100"
                            />
                          </div>
                          <div className="flex justify-center rounded-b border-gray-300 border-solid items-center">
                            <div
                              role="button"
                              className="rounded-br cursor-pointer text-xs bg-red-400 w-full p-1 text-center hover:bg-red-500 text-white"
                              onClick={() => setThumbnailUrl(null)}
                            >
                              Remove
                            </div>
                          </div>
                        </div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* ******************* Submit Thumbnail ******************* */}
              <div className="px-4 py-3 text-right sm:px-6">
                <button
                  onClick={SubmitThumbnail}
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit
                </button>
              </div>
            </div>
            {/* ******************* images_url ******************* */}
            <div className="pt-5 border-t-2 border-solid border-gray-200 mt-7">
              <div className="block text-sm font-medium text-gray-700 mb-1">
                Gallery Images
              </div>
              {/* -- Images URL -- */}
              <div className="">
                <div className="mb-4">
                  <input
                    type="text"
                    ref={ImageUrlRef}
                    placeholder="www.example.com/img.png"
                    className="mt-1 focus:border-indigo-500 block w-full 
                        shadow-sm border-2 border-solid border-gray-300 rounded-md p-1"
                  />
                  <div
                    role="button"
                    onClick={AddImagesUrl}
                    className="m-1 flex justify-end"
                  >
                    <span className="bg-green-400 rounded-sm px-2 py-1 text-white cursor-pointer">
                      <Add width={18} height={18} />
                    </span>
                  </div>
                </div>
                {/* -- Thumbnail Showcase -- */}
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center w-full">
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 rounded-md">
                      <div
                        className={classNames(
                          'w-full',
                          'h-full',
                          'rounded-md'
                        )}
                      >
                        <div className="flex justify-center items-center flex-col mb-3">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <p className="text-xs text-gray-500">
                            (make sur Thumbnail are high-resolution)
                          </p>
                        </div>
                        <div className="flex justify-center flex-wrap items-center">
                          {ImagesUrl?.map((url, index) => (
                            <div key={index} className="card-container rounded m-2">
                              <div style={{ width: '100px' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  className="rounded-t"
                                  src={url}
                                  alt=""
                                  width="100"
                                  height="100"
                                />
                              </div>
                              <div className="flex justify-center rounded-b border-gray-300 border-solid items-center">
                                <div
                                  role="button"
                                  className="rounded-br cursor-pointer text-xs bg-red-400 w-full p-1 text-center hover:bg-red-500 text-white"
                                  onClick={() => {
                                    setImagesUrl((prev) =>
                                      prev.filter((_url) => _url !== url)
                                    );
                                  }}
                                >
                                  Remove
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* ******************* Submit Images ******************* */}
                <div className="px-4 py-3 text-right sm:px-6">
                  <button
                    onClick={SubmitImages}
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>)
}

const GalleryUploadByDnD = ({ token, images, setImages, ThumbnailImage, setThumbnailImage, Notify }) => {

  const [Loading, setLoading] = useState(false);

  const onImageChange = (imageList, addUpdateIndex) => {
    // data for submit
    console.log(imageList, addUpdateIndex);
    setImages(imageList);
  };

  const onThumbnailChange = (imageList, addUpdateIndex) => {
    // data for submit
    console.log(imageList, addUpdateIndex);
    setThumbnailImage(imageList);
  };

  const Form_Data = (image, title) => {
    const formData = new FormData();
    formData.append('image', image?.data_url);
    formData.append('title', title);
    return formData
  }


  const SubmitThumbnail = (e) => {
    e.preventDefault();

    setLoading(() => true);

    fetch(`${HostUrl}/api/upload`, {
      method: 'POST',
      body: Form_Data(ThumbnailImage[0], 'my product from ali'),
    })
      .then((response) => response.json())
      .then(({ success }) => {
        console.log(`success`, { success })
        Notify(`🚀 Thumbnail successfully uploaded`, true);
      })
      .catch((error) => {
        console.error(error);
        Notify(`🚀 ops, something happened`, false);
      });

    setLoading(() => false);
  }

  const SubmitImages = async (e) => {
    e.preventDefault();
    setLoading(() => true);
    let FetchArray = []

    for (let i = 0; i < images.length; i++) {
      FetchArray.push(fetch(`${HostUrl}/api/upload`,
        { method: 'POST', body: Form_Data(images[i], 'my product from ali') }))
    }

    // eslint-disable-next-line no-undef
    await Promise.all(FetchArray).then((data) => {
      console.log(`data`, { data })
    }).catch((err) => {
      console.log(err);
    });

    let progress = 0;
    FetchArray.forEach(p => p.then(() => {
      progress++;
      console.log(progress / FetchArray.length * 100 + "%");
    }));
    setLoading(() => false);
  }


  return (
    <form className="m-auto">
      {Loading && (
        <div
          className="absolute bg-black bg-opacity-10 rounded-lg inset-0 flex justify-center items-center">
          <LoadingSvg width={80} height={80} />
        </div>
      )}
      <div style={{ borderTop: '0', borderTopLeftRadius: '0', borderTopRightRadius: '0' }}
        className="shadow overflow-hidden md:rounded-lg card-container rounded-none">
        <div className="flex justify-center items-center px-4 py-3 text-gray-800 bg-gray-50 text-right sm:px-6">
          <span className="uppercase text-sm">Add Product Images</span>
        </div>
        <div className="px-4 py-5 bg-white sm:p-6">
          <div className="block">
            {/* ******************* thumbnail ******************* */}
            <div className="">
              <div className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail Image
              </div>
              {/* -- DRAG&DROP-- */}
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center w-full">
                  {/* --thumbnail upload-- */}
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 rounded-md">
                    <ImageUploading
                      multiple
                      value={ThumbnailImage}
                      onChange={onThumbnailChange}
                      maxNumber={1}
                      dataURLKey="data_url"
                      imgExtension={['.jpg', '.png', '.jpeg', '.webp']}
                    >
                      {({
                        imageList,
                        onImageUpload,
                        onImageUpdate,
                        onImageRemove,
                        isDragging,
                        dragProps
                      }) => (
                        <div
                          {...dragProps}
                          className={classNames(
                            'w-full',
                            'h-full',
                            'rounded-md',
                            {
                              'bg-green-100': isDragging
                            }
                          )}
                        >
                          <div className="flex justify-center items-center flex-col mb-3">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div
                              role="button"
                              className="flex cursor-pointer justify-center items-center"
                              onClick={onImageUpload}
                            >
                              <div className="flex text-sm text-gray-600 justify-center items-center">
                                <div
                                  className="rounded-md hover:underline font-medium text-indigo-600 
                                    hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 
                                    focus-within:ring-indigo-500"
                                >
                                  <span>Upload image</span>
                                </div>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, ((make sur it&#39;s
                              high-resolution))
                            </p>
                          </div>
                          <div className="flex justify-center flex-wrap items-center">
                            {imageList.map((image, index) => (
                              <div
                                key={index}
                                className="card-container rounded m-2"
                              >
                                <div style={{ width: '100px' }}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    className="rounded-t"
                                    src={image['data_url'] ?? image}
                                    alt=""
                                    width="100"
                                    height="100"
                                  />
                                </div>
                                <div className="flex justify-center rounded-b border-gray-300 border-solid items-center">
                                  <div
                                    role="button"
                                    className="rounded-bl cursor-pointer text-xs bg-green-400 w-full p-1 text-center border-gray-300 border-solid border-r hover:bg-green-500 text-white"
                                    onClick={() => onImageUpdate(index)}
                                  >
                                    Update
                                  </div>
                                  <div
                                    role="button"
                                    className="rounded-br cursor-pointer text-xs bg-red-400 w-full p-1 text-center hover:bg-red-500 text-white"
                                    onClick={() => onImageRemove(index)}
                                  >
                                    Remove
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </ImageUploading>
                  </div>
                </div>
              </div>
              {/* ******************* Submit Thumbnail ******************* */}
              <div className="px-4 py-3 text-right sm:px-6">
                <button
                  onClick={SubmitThumbnail}
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit
                </button>
              </div>
            </div>
            {/* ******************* images_url ******************* */}
            <div className="pt-5 border-t-2 border-solid border-gray-200 mt-7">
              <div className="block text-sm font-medium text-gray-700 mb-1">
                Gallery Images
              </div>
              {/* -- DRAG&DROP -- */}
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <ImageUploading
                  multiple
                  value={images}
                  onChange={onImageChange}
                  maxNumber={20}
                  dataURLKey="data_url"
                  imgExtension={['.jpg', '.png', '.jpeg', '.webp']}
                // resolutionType='ratio'
                // resolutionWidth={800}
                // resolutionHeight={800}
                // onError={(errors, files) => {
                //     console.log({ errors, files })
                //     if (errors.resolution) {
                //         setImageError(true)
                //         setTimeout(() => setImageError(false), 8000)
                //     }
                // }}
                >
                  {({
                    imageList,
                    onImageUpload,
                    onImageRemoveAll,
                    onImageUpdate,
                    onImageRemove,
                    isDragging,
                    dragProps
                  }) => (
                    <div
                      {...dragProps}
                      className={classNames(
                        'w-full',
                        'h-full',
                        'rounded-md',
                        {
                          'bg-green-100': isDragging
                        }
                      )}
                    >
                      <div className="flex justify-center items-center flex-col mb-3">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div
                          role="button"
                          className="flex cursor-pointer justify-center items-center"
                          onClick={onImageUpload}
                        >
                          <div className="flex text-sm text-gray-600 justify-center items-center">
                            <div
                              className="rounded-md hover:underline font-medium text-indigo-600 
                                    hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 
                                    focus-within:ring-indigo-500"
                            >
                              <span>Upload multiple images</span>
                            </div>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                        </div>
                        <div
                          role="button"
                          className="text-red-700 text-sm cursor-pointer hover:underline"
                          onClick={onImageRemoveAll}
                        >
                          Remove all images
                        </div>
                      </div>
                      <div className="flex justify-center flex-wrap items-center">
                        {imageList.map((image, index) => (
                          <div
                            key={index}
                            className="card-container rounded m-2"
                          >
                            <div style={{ width: '100px' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                className="rounded-t"
                                src={image['data_url']}
                                alt=""
                                width="100"
                                height="100"
                              />
                            </div>
                            <div className="flex justify-center rounded-b border-gray-300 border-solid items-center">
                              <div
                                role="button"
                                className="rounded-bl cursor-pointer text-xs bg-green-400 w-full p-1 text-center border-gray-300 border-solid border-r hover:bg-green-500 text-white"
                                onClick={() => onImageUpdate(index)}
                              >
                                Update
                              </div>
                              <div
                                role="button"
                                className="rounded-br cursor-pointer text-xs bg-red-400 w-full p-1 text-center hover:bg-red-500 text-white"
                                onClick={() => onImageRemove(index)}
                              >
                                Remove
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </ImageUploading>
              </div>
              {/* ******************* Submit Images ******************* */}
              <div className="px-4 py-3 text-right sm:px-6">
                <button
                  onClick={SubmitImages}
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>)
}

export async function getServerSideProps(context) {
  const { req } = context;
  const { token } = getAppCookies(req);
  const userInfo = token ? verifyToken(token) : null;

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
}

NewProduct.propTypes = {
  token: PropTypes.string,
  userInfo: PropTypes.object
};

export default NewProduct;
