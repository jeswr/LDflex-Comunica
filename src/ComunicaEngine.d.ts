import { NamedNode as RDFNamedNode, Term } from 'rdf-js';
import { ActorInitSparql } from '@comunica/actor-init-sparql/index-browser';
import { BindingsStream } from '@comunica/bus-query-operation';
import { Store } from 'n3';
import { Algebra } from "sparqlalgebrajs";
declare type RawSources = URL | NamedNode | Store | string;
declare type RawSourcesString = RawSources | string;
declare type AllSources = RawSourcesString | RawSourcesString[];
declare type Source = {
    value: string;
    type: string | null;
    match?: Function;
};
declare type Sources = Source[];
interface NamedNode extends RDFNamedNode {
    match: Function;
}
export interface queryEngine {
    execute(query: string | Algebra.Operation, sources?: Promise<RawSources> | RawSources | undefined): AsyncGenerator<Term | any, void, undefined>;
}
/**
 * Asynchronous iterator wrapper for the Comunica SPARQL query engine.
 */
export default class ComunicaEngine implements queryEngine {
    private _sources;
    private DefaultEngine;
    private _engine;
    private LocalEngine;
    private MemoryEngine;
    private _allowEngineChange;
    /**
     * Create a ComunicaEngine to query the given default source.
     *
     * The default source can be a single URL, an RDF/JS Datasource,
     * or an array with any of these.
     */
    constructor(defaultSource: Promise<RawSources> | RawSources, engine?: () => ActorInitSparql);
    private setEngine;
    private getEngine;
    /**
     * Creates an asynchronous iterable of results for the given SPARQL query.
     */
    execute(sparql: string, source?: Promise<RawSources> | RawSources | undefined): AsyncGenerator<Term | any, void, undefined>;
    /**
     * Creates an asynchronous iterable with the results of the SPARQL UPDATE query.
     */
    executeUpdate(sparql: string, sources: Sources, engine: ActorInitSparql): AsyncGenerator<never, void, unknown>;
    /**
     * Parses the source(s) into an array of Comunica sources.
     */
    parseSources(source: Promise<AllSources> | AllSources): Promise<Sources>;
    /**
     * Transforms the readable into an asynchronously iterable object
     */
    streamToAsyncIterable(readable: BindingsStream): AsyncIterableIterator<Term>;
    /**
     * Removes the given document (or all, if not specified) from the cache,
     * such that fresh results are obtained next time.
     */
    clearCache(document: string): Promise<void>;
}
export {};
