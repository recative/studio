import installExtension, {
  REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer';

export const installDevTools = () => {
  return new Promise((resolve, reject) => {
    installExtension(REACT_DEVELOPER_TOOLS, {
      loadExtensionOptions: {
        allowFileAccess: true,
      },
    })
      .then((name) => resolve(name))
      .catch((error) => reject(error));
  });
};
