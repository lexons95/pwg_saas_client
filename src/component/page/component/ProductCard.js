import React from 'react';
import { Tag, Tooltip } from 'antd';
import { defaultImage_system } from '../../../utils/Constants';
import { useConfigCache } from '../../../utils/customHook';

const ProductCard = (props) => {
  const { product } = props;
  const config = useConfigCache();

  const getProductImages = () => {
    let srcResult = config.defaultImage;
    if (product.images && product.images.length > 0) {
      let foundFavImage = product.images.find((anImage)=>anImage.fav);
      if (foundFavImage) {
        srcResult = config.imageSrc + foundFavImage.name;
      }
    }
    return {
      backgroundImage: `url(${srcResult})`
    }
  }


  return (
    <div className="productCard-container">
      <div className="productCard-media" style={getProductImages()}></div>
      <div className="productCard-info">
        
        <div className="productCard-status">
          <Tooltip title={product.name}>
            <div className="productCard-title">{product.name}</div>
          </Tooltip>
          {
            product.published ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>
          }
        </div>
      </div>
    </div>
  );
}

export default ProductCard;