export interface Config {
    verbose: boolean; 
    version: boolean;
    help: boolean;
    config: string;    
    previous: string,
    next: string,
    out: string;
    flatOut: string;
    ignore: string;
    mapSourceDir: string;
    excludeRootNode: boolean;    
}