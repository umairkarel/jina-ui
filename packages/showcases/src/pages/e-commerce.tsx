import Head from "next/head";
import JinaClient, {
    RawDocumentData,
    SimpleResults,
    SimpleQueries,
    AnyObject,
    fileToBase64,
} from "@jina-ai/jinajs";
import {Results} from "../components/Results";
import React, {useEffect, useState, useCallback, useRef} from "react";
import {Spinner} from "../components/Spinner";
import {MediaPreview} from "../components/common/MediaPreview";
import {TextPreview} from "../components/common/TextPreview";
import {ShoppingCartIcon} from "@heroicons/react/outline";
import schema from "../types/e-commerce/schema.json"
import {OpenAPIV3} from "openapi-types";
import Dropzone from 'react-dropzone'
import {isValidHttpUrl} from "../utils/utils";
import About from "../components/common/About";
import { ExampleQueries, ExampleQueryItem } from "../components/common/ExampleQueries";

const SearchIcon = '/assets/searchIcon.svg'

const exampleQueries: ExampleQueryItem[] = [
    {src:"https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg",mimeType:"image"},
    {src:"https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg",mimeType:"image",text:"black"},
    {src:"https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg",mimeType:"image",text:"blue"},
]
import { debounce } from '../utils/utils';

const Filter = ({
                    title,
                    onSelect,
                    current,
                    options,
                }: {
    title: string;
    current: string;
    onSelect: (option: string) => void;
    options: string[];
}) => (
    <div className="px-3 bg-blue-500 bg-opacity-10 border-2 border-blue-500 rounded flex flex-row items-center w-36">
        <select
            value={current}
            onChange={(e) => onSelect(e.target.value)}
            className="bg-transparent outline-none cursor-pointer capitalize"
        >
            <option value="">Any {title}</option>
            {options.map((item) => (
                <option value={item} key={item}>
                    {item}
                </option>
            ))}
        </select>
    </div>
);

const Filters = ({ onFilter, }: { onFilter: (filters: FilterCondition[]) => void }) => {
    const [season, setSeason] = useState("");
    const [price, setPrice] = useState("");
    const [gender, setGender] = useState("");
    const [color, setColor] = useState("");
    const [category, setCategory] = useState("");

    useEffect(() => {
        const filters: FilterCondition[] = [];
        if (season)
            filters.push({attribute: "season", operator: "eq", value: season});
        if (price === "Under $500")
            filters.push({attribute: "price", operator: "lt", value: 500});
        if (price === "Under $200")
            filters.push({attribute: "price", operator: "lt", value: 200});
        if (color)
            filters.push({attribute: "color", operator: "eq", value: color});
        if (gender)
            filters.push({attribute: "gender", operator: "eq", value: gender});
        if (category)
            filters.push({attribute: "category", operator: "eq", value: category});

        return onFilter(filters);
    }, [season, price, gender, color, category]);

    return (
        <div className="flex flex-wrap flex-row gap-1 md:gap-4 mt-3">
            <Filter
                title="Season"
                current={season}
                onSelect={setSeason}
                options={["winter", "spring", "summer", "fall"]}
            />
            <Filter
                title="Price"
                current={price}
                onSelect={setPrice}
                options={["Under $500", "Under $200"]}
            />
            <Filter
                title="Gender"
                current={gender}
                onSelect={setGender}
                options={["boys", "girls", "men", "women"]}
            />
            <Filter
                title="color"
                current={color}
                onSelect={setColor}
                options={["red", "orange", "yellow", "green", "blue", "white", "black"]}
            />
            <Filter
                title="Category"
                current={category}
                onSelect={setCategory}
                options={["apparel", "accessories"]}
            />
        </div>
    );
};

const Tag = ({children}: { children: string }) => (
    <div className="px-2 bg-gray-500 rounded-full text-white">{children}</div>
);

const ProductResult = ({result}: { result: any }) => {
    return (
        <div className="rounded border h-full flex flex-col">
            <div className="border-b">
                <MediaPreview src={result.uri} mimeType={result.mimeType}/>
            </div>
            {result.tags && (
                <div className="flex-1 flex flex-col p-3">
                    <div className="capitalize font-semibold text-lg">
                        {result.tags.display_name}
                    </div>
                    <div className="text-gray-500 flex-1">
                        <TextPreview
                            text={result.tags.description}
                            size="sm"
                            clampLines={3}
                        />
                    </div>
                    <div className="flex flex-row gap-1 capitalize mt-2">
                        <Tag>{result.tags.usage}</Tag>
                        <Tag>{result.tags.season}</Tag>
                    </div>

                    <div className="flex flex-row items-center border-t mt-2 pt-2">
                        <div className="text-2xl font-semibold flex-1">
                            ${result.tags.price}
                        </div>
                        <div
                            className="px-4 py-1 bg-blue-600 rounded-full text-white cursor-pointer flex flex-row items-center text-sm">
                            <ShoppingCartIcon className="h-3.5 inline"/>
                            <div className="ml-1">Add to Cart</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const EmptyMessage = () => (
    <div className="text-center text-3xl text-gray-500 py-36">
        Search for something
    </div>
);

const Searching = () => (
    <div className="mx-auto text-3xl py-36 flex flex-row items-center text-primary-500">
        <Spinner/>
        <span className="animate-pulse">Searching...</span>
    </div>
);

type FilterCondition = {
    attribute: string;
    operator: "eq" | "ne" | "lt" | "gt" | "le" | "ge";
    value: string | number;
};

type EcommerceShowCaseProps = {
    showFlowChart: boolean
    setShowFlowChart: (arg: boolean) => void
}

export default function EcommerceShowCase({showFlowChart, setShowFlowChart}: EcommerceShowCaseProps) {
    const url = 'https://europe-west3-jina-showcase.cloudfunctions.net/prod/shop-the-look'
    const [filters, setFilters] = useState<FilterCondition[] | undefined>();
    const [originalDocuments, setOriginalDocuments] = useState<RawDocumentData[]>([]);
    const [addDesc, setAddDesc] = useState("")
    const [queries, setQueries] = useState<SimpleQueries>([]);
    const [results, setResults] = useState<SimpleResults[]>([]);
    const [searching, setSearching] = useState(false);
    const [firstSearchTriggered, setFirstSearchTriggered] = useState(false)
    const resultsRef = useRef<HTMLDivElement>(null)
    const [isFlowChartOpenedOnce, setIsFlowChartOpenedOnce] = useState(false)
    let debouncedFlowChartOpen = useCallback(debounce(() => setShowFlowChart(true), 1000), [])

    useEffect(() => {

        if (originalDocuments.length) {
            if (addDesc !== "") search(addDesc, ...originalDocuments);
            else search(...originalDocuments)
        }
    }, [filters]);

    const customReqSerializer = async (documents: RawDocumentData[]) => {
        let uri = ""
        let text = null

        if (documents[0] instanceof File) {
            uri = await fileToBase64(documents[0] as File)
        }
        if (typeof documents[0] === "string" && isValidHttpUrl(documents[0])) {
            uri = documents[0]
        }

        if (documents.length === 2 && documents[1] instanceof File && typeof documents[0] === "string") {
            text = documents[0] as string
            uri = await fileToBase64(documents[1] as File)
        }

        if (documents.length === 2 && isValidHttpUrl(documents[1] as string) && typeof documents[0] === "string") {
            text = documents[0] as string
            uri = documents[1] as string
        }


        const request = {
            "data": [
                {
                    uri,
                    text
                }
            ],
            "parameters": {
                "top_k": 10,
                'conditions': filters
            }
        }
        return request
    }

    const customResSerializer = (response: AnyObject) => {

        return {
            queries: [],
            results: [response.data.data.docs[0].matches]
        }
    }

    const jina = new JinaClient(url, schema as OpenAPIV3.Document, false, customReqSerializer, customResSerializer)


    async function search(...documents: RawDocumentData[]) {
        if(searching) return
        setFirstSearchTriggered(true)
        setResults([])
        setSearching(true);
        const {results, queries} = await jina.search(...documents);
        setSearching(false);
        setResults(results);
        setQueries(queries);
        resultsRef.current?.scrollIntoView({behavior: "smooth", block: "center"})
        !isFlowChartOpenedOnce && debouncedFlowChartOpen()
        setIsFlowChartOpenedOnce(true)
    }


    const onFilter = (filters: FilterCondition[]) => {
        setFilters([...filters]);
    };

    function handleExampleQuery(query: ExampleQueryItem){
        const {src,text} = query;

        if(!src) return;

        setOriginalDocuments([src]);

        if(text)
            onFilter([{attribute: "color", operator: "eq", value: text}]);
        else
            search(src);
    }

    return (
        <div className="px-6">
            <Head>
                <title>Shop The Look</title>
                <link rel="icon" href="/favicon.ico"/>
            </Head>

            <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Search fashion products with an image+description</p>
                <Dropzone onDrop={acceptedFiles => {
                    setOriginalDocuments(acceptedFiles)
                    search(addDesc, ...acceptedFiles)
                }}>
                    {({getRootProps, getInputProps}) => (
                        <div {...getRootProps()}
                             className="border-b-0 cursor-pointer border border-primary-500 rounded-t flex flex-col items-center p-8 ">
                            <div className="h-8 w-8 mb-3">
                                <img src={SearchIcon}/>
                            </div>
                            <input {...getInputProps()} />
                            <p className="font-bold w-72 text-center">Drag and drop your image here or <span
                                className="text-primary-500">Browse</span> to select a file
                            </p>
                        </div>
                    )}
                </Dropzone>
                <input
                    onChange={(event) => setAddDesc(event.target.value)}
                    onKeyUp={(event) => { if(event.key === 'Enter') search(addDesc, ...originalDocuments) }
                    className="textInput appearance-none block w-full text-gray-700 border border-primary-500 rounded-b py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                    id="grid-first-name" type="text" placeholder="Add additional description"/>
                <style jsx>
                    {`
                      .textInput {
                        border-top-color: #E5E5E5;
                      }
                    `}
                </style>
            </div>

            <Filters onFilter={onFilter}/>
            <div className="my-6">
                <ExampleQueries queries={exampleQueries} onClick={handleExampleQuery} size="small"/>
            </div>
            

            {
                !firstSearchTriggered ?
                    <About
                        className="mt-6"
                        aboutPoints={[
                            "We built this using python, jina, tensorflow, etc.",
                            "We trained the __model__ and indexed 10k papers for now, we are planning to add more and make this more complete.",
                            <span key="someElement">Reports problems/feature-requests at <a className="text-primary-500"
                                                                                            href="https://github.com/jina-ai/examples/issues/new">https://github.com/jina-ai/examples/issues/new</a></span>
                        ]}/>
                    :
                    <div ref={resultsRef}>
                        {searching ? (
                            <Searching/>
                        ) : results.length ? (
                        <>
                                <Results
                                    results={results}
                                    CustomResultItem={ProductResult}
                                    classNames="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4"
                                />
                        </>
                        ) : (
                            <EmptyMessage/>
                        )}
                    </div>
            }


        </div>

    );
}
