import minimist from '@@internals/minimist';


export async function __$main(): Promise<void> {
  const argv = minimist(process.argv.slice(2), {
    '--': true,
  });

  const command = argv._[0];
  console.log({command});
}
