import { YeetImageContainer } from "../../lib/imageSearch";
import { GallerySection } from "./GallerySection";
import { GallerySectionItem } from "../NewPost/ImagePicker/FilterBar";
import { NetworkStatus } from "apollo-client";

export const buildSection = (
  type: GallerySectionItem,
  data: Array<YeetImageContainer>,
  networkStatus: NetworkStatus
): GallerySection => {
  return {
    type,
    data: data.map(image => ({
      id: image.id,
      image: image
    })),
    networkStatus
  };
};
