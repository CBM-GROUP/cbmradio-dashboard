export type SocialPlatform="facebook"|"instagram"|"youtube"|"x"|"linkedin"|"tiktok"|"whatsapp";
export type SocialLink={id:number;platform_key:SocialPlatform;platform_label:string;url:string;is_active:boolean;display_order:number;created_at:string;updated_at:string};
export type SiteContact={business_phone:string;business_email:string;physical_address:string;updated_at:string};
export type PageKey="programs"|"episodes"|"news"|"gallery"|"about"|"contact";
export type HeroMediaType="none"|"image"|"video"|"slides"; export type ImageSource=""|"upload"|"external"; export type OverlayPosition="left"|"center"|"right";
export type HeroSlide={id:number;page_hero:number;title:string;subtitle:string;description:string;media_type:"image"|"video";image_source:ImageSource;uploaded_image:string|null;external_image_url:string;video_url:string;resolved_image_url:string;cta_label:string;cta_url:string;display_order:number;is_active:boolean;created_at:string;updated_at:string};
export type PageHero={id:number;page_key:PageKey;title:string;subtitle:string;description:string;media_type:HeroMediaType;image_source:ImageSource;uploaded_image:string|null;external_image_url:string;video_url:string;resolved_image_url:string;cta_label:string;cta_url:string;overlay_strength:number;overlay_position:OverlayPosition;is_active:boolean;slides:HeroSlide[];created_at:string;updated_at:string};
export const pageKeys:PageKey[]=["programs","episodes","news","gallery","about","contact"];
export const socialPlatforms:SocialPlatform[]=["facebook","instagram","youtube","x","linkedin","tiktok","whatsapp"];
