"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const comunica_engine_1 = __importDefault(require("../lib/comunica-engine"));
const actor_init_sparql_file_1 = require("@comunica/actor-init-sparql-file");
const actor_init_sparql_rdfjs_1 = require("@comunica/actor-init-sparql-rdfjs");
const n3_1 = require("n3");
const fs = __importStar(require("fs"));
/**
 * Asynchronous iterator wrapper for the Comunica SPARQL query engine.
 */
class ComunicaEngine {
    /**
     * Create a ComunicaEngine to query the given default source.
     *
     * The default source can be a single URL, an RDF/JS Datasource,
     * or an array with any of these.
     */
    constructor(defaultSource, engine) {
        this.DefaultEngine = comunica_engine_1.default;
        this._engine = this.DefaultEngine;
        this.LocalEngine = actor_init_sparql_file_1.newEngine();
        this.MemoryEngine = actor_init_sparql_rdfjs_1.newEngine();
        this._allowEngineChange = true;
        // Preload sources but silence errors; they will be thrown during execution
        this._sources = this.parseSources(defaultSource);
        this._sources.catch(() => null);
        this._engine = this.setEngine(engine);
    }
    async setEngine(engine) {
        if (engine) {
            this._allowEngineChange = false;
            return engine();
        }
        else if ((await this._sources).length > 0 && (await this._sources).some(location => !isValidURL(location.value)))
            return this.LocalEngine;
        else if ((await this._sources).length > 0 && (await this._sources).some(location => location instanceof n3_1.Store))
            return this.MemoryEngine;
        else
            return this.DefaultEngine;
    }
    async getEngine(sources) {
        return await this._engine;
        if (this._allowEngineChange) {
            return (sources.length > 0 && (sources.some(location => !isValidURL(location.value))))
                ? this.LocalEngine
                : this.DefaultEngine;
        }
        else {
            return await this._engine;
        }
    }
    /**
     * Creates an asynchronous iterable of results for the given SPARQL query.
     */
    async *execute(sparql, source) {
        // Load the sources if passed, the default sources otherwise    
        const sources = await (source ? this.parseSources(source) : this._sources);
        const engine = await this.getEngine(sources);
        if (sources.length !== 0) {
            if ((/^\s*(?:INSERT|DELETE)/i).test(sparql))
                yield* this.executeUpdate(sparql, sources, engine);
            else {
                const queryResult = await engine.query(sparql, { sources });
                yield* this.streamToAsyncIterable(queryResult.bindingsStream);
            }
        }
    }
    /**
     * Creates an asynchronous iterable with the results of the SPARQL UPDATE query.
     */
    async *executeUpdate(sparql, sources, engine) {
        // console.log('the engine is', engine)
        if (true || engine instanceof actor_init_sparql_file_1.newEngine) {
            for (const source of sources) {
                const parser = new n3_1.Parser();
                const writer = new n3_1.StreamWriter();
                const triples = /\{[^]*\}/.exec(sparql)?.[0].replace('{', '').replace('}', '');
                const writeStream = fs.createWriteStream(source.value).write(triples);
            }
            // {
            //   size: 1,
            //   values: () => true,
            //   bindings: {
            //     values: () => true
            //   }
            // };
            // const triples = /\{[^]*\}/.exec(sparql)?.[0].replace('{', '').replace('}', '')
            // fs.createWriteStream
            // parser.parse(triples, (error: Error, quad: Quad, prefixes: Prefixes<string>) => {
            //   if (quad) store.addQuad(quad)
            //   else if (prefixes) executer({store, prefixes})
            //   else reject(`Error occured when parsing file ${path}: ${error}`)
            // }))
        }
        else {
            throw new Error(`SPARQL UPDATE queries are unsupported, received: ${sparql}`);
        }
        throw new Error(`Inside sparq update`);
        // yield this.execute(
        //   'SELECT DISTINCT ?subject WHERE { ?subject ?p ?o }',
        //   // @ts-ignore
        //   this._sources
        // )
    }
    /**
     * Parses the source(s) into an array of Comunica sources.
     */
    async parseSources(source) {
        let sources = await source;
        if (!sources)
            return [];
        // Transform URLs or terms into strings
        if (sources instanceof URL)
            sources = sources.href;
        else if (typeof sources === 'object' && 'termType' in sources && sources.termType === 'NamedNode')
            sources = sources.value;
        let allSources;
        // Strip the fragment off a URI
        if (typeof sources === 'string')
            allSources = [sources.replace(/#.*/, '')];
        // Flatten recursive calls to this function
        else if (Array.isArray(sources))
            allSources = await flattenAsync(sources.map(s => this.parseSources(s)));
        // Needs to be after the string check since those also have a match functions
        else if (typeof sources === 'object' && 'match' in sources && typeof sources.match === 'function')
            allSources = [Object.assign({ type: 'rdfjsSource' }, sources)];
        // Wrap a single source in an array
        else if (typeof source === 'object' && 'value' in source && typeof source.value === 'string')
            allSources = [sources];
        // Error on unsupported sources
        else
            throw new Error(`Unsupported source: ${source}`);
        // @ts-ignore Add Comunica source details
        return allSources.map((src) => ({
            value: (typeof src === 'object' && 'value' in src) ? (src.value ?? src) : src,
            type: (typeof src === 'object' && 'type' in src) ? src.type : null
        }));
    }
    /**
     * Transforms the readable into an asynchronously iterable object
     */
    streamToAsyncIterable(readable) {
        // Track errors even when no next item is being requested
        let pendingError;
        readable.once('error', error => pendingError = error);
        // Return a asynchronous iterable
        return {
            next: () => new Promise(readNext),
            [Symbol.asyncIterator]() { return this; },
        };
        // Reads the next item
        function readNext(resolve, reject) {
            if (pendingError)
                return reject(pendingError);
            if (readable.ended)
                return resolve({ done: true, value: null });
            // Attach stream listeners
            readable.on('data', yieldValue);
            readable.on('end', finish);
            readable.on('error', finish);
            // Outputs the value through the iterable
            function yieldValue(value) {
                finish(null, value, true);
            }
            // Clean up, and reflect the state in the iterable
            function finish(error, value, pending) {
                readable.removeListener('data', yieldValue);
                readable.removeListener('end', finish);
                readable.removeListener('error', finish);
                return error ? reject(error) : resolve({ value, done: !pending });
            }
        }
    }
    /**
     * Removes the given document (or all, if not specified) from the cache,
     * such that fresh results are obtained next time.
     */
    async clearCache(document) {
        await (await this._engine).invalidateHttpCache(document);
        await this.LocalEngine.invalidateHttpCache(document);
        await this.DefaultEngine.invalidateHttpCache(document);
    }
}
exports.default = ComunicaEngine;
// Flattens the given array one level deep
async function flattenAsync(array) {
    return (await Promise.all(array)).flat();
}
function isValidURL(location) {
    try {
        new URL(location);
        return true;
    }
    catch {
        return false;
    }
}
