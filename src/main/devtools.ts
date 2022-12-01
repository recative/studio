import installExtension, {
  REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer';

const a = (installExtension as any).default as typeof installExtension;

export const installDevTools = () => {
  return new Promise((resolve, reject) => {
    a(REACT_DEVELOPER_TOOLS, {
      loadExtensionOptions: {
        allowFileAccess: true,
      },
    })
      .then((name) => resolve(name))
      .catch((error) => reject(error));
  });
};
