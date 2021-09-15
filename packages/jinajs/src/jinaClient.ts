import axios, { AxiosInstance } from "axios";
import { serializeRequest, serializeResponse } from "./serializer";
import MockedClient from './MockedClient'
import {
  BaseURL,
  RawDocumentData,
  RequestSerializer,
  ResponseSerializer,
  SimpleQueries,
  SimpleResults,
} from "./types";
import { OpenAPIV3 } from "openapi-types";


export class JinaClient<IRequest,IResponse> {

  private baseURL: string;
  private client: AxiosInstance;
  private serializeRequest: RequestSerializer<IRequest>
  private serializeResponse: ResponseSerializer<IResponse>
  private schema: OpenAPIV3.Document
  private debugMode: boolean

  constructor(baseURL: BaseURL, schema: OpenAPIV3.Document, debugMode: boolean, customSerializeRequest?: RequestSerializer<IRequest>, customSerializeResponse?: ResponseSerializer<IResponse> ) {
    this.schema =  schema
    console.log("constructor", schema)
    console.log("debugMode", debugMode)
    this.debugMode = debugMode
    this.serializeRequest = customSerializeRequest || serializeRequest
    this.serializeResponse = customSerializeResponse || serializeResponse
    this.baseURL = baseURL;
    if(debugMode) this.client = new MockedClient(this.schema) as unknown as AxiosInstance
    else this.client = axios.create({ baseURL })

    this.init();
  }

  async init() {
    try {
      const response = await this.client.get("status");
      if (response?.data?.jina?.jina) console.log("connected!")
    } catch (e) {
        if(this.debugMode) console.log("jina client started in debug mode!")
      else throw new Error(
            `Could not reach flow at ${this.baseURL}. Check the URL and make sure CORS is enabled.`
        );

    }
  }

  async search(
    ...documents: RawDocumentData[]
  ): Promise<{ results: SimpleResults[]; queries: SimpleQueries }> {
    const requestBody = await this.serializeRequest(documents);
    console.log("request body:", requestBody);
    const response = await this.client.post("search", requestBody) as IResponse;
    console.log("response:", response);
    return this.serializeResponse(response);
  }
}
