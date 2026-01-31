import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem('token')
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    }
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials
      })
    }),
    // placeholder for refreshToken mutation
    refresh: builder.mutation({
      query: (payload) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: payload
      })
    })
  })
})

export const { useLoginMutation, useRefreshMutation } = authApi
