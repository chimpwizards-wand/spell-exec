import Debug from 'debug';
import { Command } from  '@chimpwizards/wand'
import { Config } from '@chimpwizards/wand'
import { Execute } from '@chimpwizards/wand'
import { CommandDefinition, CommandParameter, CommandArgument } from '@chimpwizards/wand/commons/command/index'
import * as _ from 'lodash';  
import * as path from 'path';

const progress = require('cli-progress');
const chalk = require('chalk')
const debug = Debug("w:cli:shell");

@CommandDefinition({ 
    description: 'Execute a command across all packages/components',
    alias: 'x',
    examples: [
        [`shell 'git commit -am "Update changes"'`, `Execute "git commit.." command in all packages folders`],
        [`shell --- git commit -am "Update changes"`, `Execute "git commit.." command in all packages folders`],
        [`shell --no-root 'ls -la'`, `Execute "ls -la" command except on the root folder`],
        [`shell --filter hello-world pwd`, `execute the "pwd" command on the packages's name matching "hello-world"`],
    ]
})
export class Shell extends Command  { 

    @CommandArgument({ description: 'Command to execute', name: 'shell-command'})
    @CommandParameter({ description: 'Command to execute', alias: 'c'})
    command: string = '';

    @CommandParameter({ description: 'Include root folder', defaults: true})
    root: boolean = true;

    @CommandParameter({ description: 'Include dependencies folders', defaults: true})
    dependencies: boolean = true;

    @CommandParameter({ description: 'Show more inforamtion about the execution', defaults: false})
    verbose: boolean = false;    

    @CommandParameter({ description: 'Filter Package/Component name ising this filter/search criteria where the command will be executed', defaults: '*'})
    filter: string = "*";

    @CommandParameter({ description: 'Tag(s) to use to filter components. if several are provided it will be use with AND condition'})
    tags: string = "";


    execute(yargs: any): void {
        debug(`Exec ${this.command}`)
        debug(`THIS ${JSON.stringify(this)}`)
        debug(`YARGS ${JSON.stringify(yargs)}`)

        const args = process.argv.slice(3);
        debug(`ARGS ${JSON.stringify(args)}`)
       
        let self = this;
        const executer = new Execute();
        
        let cmd = this.command;

        if (args.join(" ").indexOf("---")>=0) {
            cmd = args.join(" ").substring(args.join(" ").indexOf("---")+4)
                .replace("::","|")
                .replace("!!","|")
        }

        const cwd = process.cwd();
        const config = new Config();
        const context = config.load()
        debug(`CONFIG: ${context}`)

        const bar = new progress.SingleBar({
            format: 'Processing |' + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total} Dependencies || {dependency}',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });

        let dependencies = []

        //Add root
        if (this.root) {
            debug(`Execute command on dependencies`)
            dependencies.push({ 
                cmd: cmd, 
                folder: context.local.root, 
                output: this.verbose,
                dependency: "root",
                tags: []
            })
        }

        //Add dependencies
        if (this.dependencies) {
            if(context) {
                _.each(context.dependencies||[], (pack, name) => {
                    dependencies.push({ 
                        cmd: cmd, 
                        folder: path.join(context.local.root, pack.path), 
                        output: this.verbose,
                        dependency: pack.path,
                        tags: pack.tags
                    })
                })
            }
        }

        //Filter by tags if rovided
        if (this.tags.length>0) {
            let tmp: any = []
            let query = self.tags.split(",")
            _.each(dependencies, (pack, name) => {
                let diff = _.difference(query, pack.tags)
                if ( diff.length == 0) {
                    tmp.push(pack)
                }
            })
            dependencies = tmp;
        }

        //Filter by filter/regexpr
        if (this.filter != "*") {
            let tmp: any = []
            
            _.each(dependencies, (pack, name) => {
                debug(`Marching: ${pack.dependency}`)
                var matcher = new RegExp(self.filter ,"gi");
                let test = matcher.test(pack.dependency);
                if (test) {
                    tmp.push(pack)
                }
            })
            dependencies = tmp;
        }


        bar.start(dependencies.length, 0, {
            dependency: "Preparing"
        });
        
        debug(`CONFIG ${JSON.stringify(context)}`)
        _.each(dependencies, (pack, name) => {
            debug(`EXECUTING (${name}): ${cmd}`)
            executer.run( {
                cmd: cmd, 
                folder: pack.folder, 
                output: this.verbose
            })

            bar.increment({dependency: pack.dependency});

        });
        


        

        bar.stop();
    }

}

export function register ():any {
    debug(`Registering....`)
    let command = new Shell();
    debug(`INIT: ${JSON.stringify(Object.getOwnPropertyNames(command))}`)

    return command.build()
}

