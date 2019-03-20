export interface Config {
    verbose: boolean; 
    version: boolean;
    help: boolean;
    config: string;    
    previous: string,
    previousFormat: "modules" | "namespaces";
    next: string,
    nextFormat: "modules" | "namespaces";
    out: string;
    flatOut: string;
    ignore: string;
    mapSourceDir: string;
    excludeRootNode: boolean; 
    comparePaths: boolean;
}