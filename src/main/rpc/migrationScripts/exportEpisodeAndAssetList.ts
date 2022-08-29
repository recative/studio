import {
  VIDEO_CONTENT_EXTENSION_ID,
  ACT_POINT_CONTENT_EXTENSION_ID,
} from '@recative/definitions';
import { getDb } from '../db';

export const migration = async () => {
  const db = await getDb();

  console.log(`"episode_id","episode_name"`);
  db.episode.episodes.find({}).forEach((x) => {
    console.log(`"${x.id}","${x.label.en}"`);
  });

  console.log();
  console.log();
  console.log();

  console.log(`"asset_id","content_id","assetpath","contenttype"`);
  db.episode.assets.find({}).forEach((x) => {
    if (x.contentExtensionId === VIDEO_CONTENT_EXTENSION_ID) {
      const video = db.resource.resources.findOne({
        id: x.contentId,
      });
      console.log(
        `"${x.id}","${x.contentId}","${
          video?.label[0].replaceAll(/\s/g, '') ?? '?'
        }", "video"`
      );
    } else if (x.contentExtensionId === ACT_POINT_CONTENT_EXTENSION_ID) {
      const ap = db.actPoint.actPoints.findOne({ id: x.contentId });
      console.log(
        `"${x.id}","${x.contentId}","${
          ap?.fullPath.replaceAll(/\s/g, '') ?? '?'
        }", "act-point"`
      );
    }
  });
};
