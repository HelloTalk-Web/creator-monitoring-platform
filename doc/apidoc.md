scrape creator爬虫平台，关于ins平台的请求文档

1、profile（花费1积分）
I want to make an API call to https://api.scrapecreators.com/v1/instagram/profile. 

  Please help me write code to make this API call and handle the response appropriately. Include error handling and best practices.

  Here are the details:
  
  Endpoint: GET https://api.scrapecreators.com/v1/instagram/profile
  
  Description: Gets public Instagram profile data, recent posts, and related accounts
  
  Required Headers:
  - x-api-key: Your API key
  
  Parameters:
  - handle  (Required): Instagram handle
- trim : Set to true to get a trimmed response
  
  Example Response:
  {
  "success": true,
  "data": {
    "user": {
      "ai_agent_type": null,
      "biography": "Scraping the web",
      "bio_links": [
        {
          "title": "Social Media APIs",
          "lynx_url": "https://l.instagram.com/?u=https%3A%2F%2Fscrapecreators.com%2F&e=AT32oytzGxbTPpiHKaOPg3a8nbqySwACFQBVT0tShRMXoo7PirvOqfORNEZntjWlzshBsugLij6QzvWi-lCCezNsWqPZ5Hqn",
          "url": "https://scrapecreators.com",
          "link_type": "external"
        },
        {
          "title": "My web scraping course!",
          "lynx_url": "https://l.instagram.com/?u=https%3A%2F%2Fadrianhorning.gumroad.com%2Fl%2Fthe-ultimate-web-scraping-course&e=AT0uTJJ07i9_2izRTv3b5eJZmvs4X2lOY0oAnYQ0LoEDxqxoRTIuiq9-aqf4iLjR3fDY7BAR10BBZTUsMKVvfAOxkeaobgyN",
          "url": "https://adrianhorning.gumroad.com/l/the-ultimate-web-scraping-course",
          "link_type": "external"
        }
      ],
      "fb_profile_biolink": null,
      "biography_with_entities": {
        "raw_text": "Scraping the web",
        "entities": []
      },
      "blocked_by_viewer": false,
      "restricted_by_viewer": null,
      "country_block": false,
      "eimu_id": "114948679895803",
      "external_url": "https://scrapecreators.com/",
      "external_url_linkshimmed": "https://l.instagram.com/?u=https%3A%2F%2Fscrapecreators.com%2F&e=AT2QOyCnbcuRIU7Z3_mHRtDkxiraSpS0fZqZKz2lP2lftK23jiEso9nNpoROavW_OaKmTb-9giBBrQ3hKFIgQGwmsmq--jB9",
      "edge_followed_by": {
        "count": 25116
      },
      "fbid": "17841402777077586",
      "followed_by_viewer": false,
      "edge_follow": {
        "count": 101
      },
      "follows_viewer": false,
      "full_name": "Adrian Horning",
      "group_metadata": null,
      "has_ar_effects": false,
      "has_clips": true,
      "has_guides": false,
      "has_channel": false,
      "has_blocked_viewer": false,
      "highlight_reel_count": 0,
      "has_onboarded_to_text_post_app": true,
      "has_requested_viewer": false,
      "hide_like_and_view_counts": false,
      "id": "2700692569",
      "is_business_account": true,
      "is_professional_account": true,
      "is_supervision_enabled": false,
      "is_guardian_of_viewer": false,
      "is_supervised_by_viewer": false,
      "is_supervised_user": false,
      "is_embeds_disabled": false,
      "is_joined_recently": false,
      "guardian_id": null,
      "business_address_json": "{\"city_name\": \"Austin, Texas\", \"city_id\": 106224666074625, \"latitude\": 30.26759, \"longitude\": -97.74299, \"street_address\": null, \"zip_code\": null}",
      "business_contact_method": "UNKNOWN",
      "business_email": null,
      "business_phone_number": null,
      "business_category_name": "None",
      "overall_category_name": null,
      "category_enum": null,
      "category_name": "Entrepreneur",
      "is_private": false,
      "is_verified": true,
      "is_verified_by_mv4b": false,
      "is_regulated_c18": false,
      "edge_mutual_followed_by": {
        "count": 0,
        "edges": []
      },
      "pinned_channels_list_count": 0,
      "profile_pic_url": "https://scontent-iad3-1.cdninstagram.com/v/t51.2885-19/430086429_362220943449758_2621012714660517106_n.jpg?stp=dst-jpg_e0_s150x150_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=102&_nc_ohc=bQwYevo7DQIQ7kNvgFIVNZE&_nc_gid=fca53e0e047a4c5f93d520676b6366b5&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AYAiPpD6ibLR9blNyb59-KNrQjsyYe3o1UkTyjK_fG92dw&oe=6799C629&_nc_sid=8b3546",
      "profile_pic_url_hd": "https://scontent-iad3-1.cdninstagram.com/v/t51.2885-19/430086429_362220943449758_2621012714660517106_n.jpg?stp=dst-jpg_s320x320_tt6&_nc_ht=scontent-iad3-1.cdninstagram.com&_nc_cat=102&_nc_ohc=bQwYevo7DQIQ7kNvgFIVNZE&_nc_gid=fca53e0e047a4c5f93d520676b6366b5&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AYB5Q4gPMQ1Qm2hPTXH8rEpUEPkDxd0pRuPA6QdBf37jPQ&oe=6799C629&_nc_sid=8b3546",
      "requested_by_viewer": false,
      "should_show_category": false,
      "should_show_public_contacts": true,
      "show_account_transparency_details": true,
      "show_text_post_app_badge": false,
      "remove_message_entrypoint": false,
      "transparency_label": null,
      "transparency_product": null,
      "username": "adrianhorning",
      "connected_fb_page": null,
      "pronouns": [],
      "edge_felix_video_timeline": {
        "count": 0,
        "page_info": {
          "has_next_page": false,
          "end_cursor": null
        },
        "edges": []
      },
      "edge_owner_to_timeline_media": {
        "count": 71,
        "page_info": {
          "has_next_page": true,
          "end_cursor": "QVFDdUZKSGhpeXExcGp5SVppc09Pd1lNbDhkSEZfeDhzUlNwaThFTlNZckdmZG40Q2hKSmxuX1FVS3dlbmpqWkVvMTBGUkVvSklVMWktWEx2T1JlRGlFQw=="
        },
        "edges": [
          {
            "node": {
              "__typename": "GraphVideo",
              "id": "3540614075954356349",
              "shortcode": "DEiyb48AeB9",
              "dimensions": {
                "height": 1920,
                "width": 1080
              },
              "display_url": "https://scontent-iad3-2.cdninstagram.com/v/t51.2885-15/472965900_18326364268092570_5931185706033057724_n.jpg?stp=dst-jpg_e35_p1080x1080_sh0.08_tt6&_nc_ht=scontent-iad3-2.cdninstagram.com&_nc_cat=106&_nc_ohc=xKs91h4eoI0Q7kNvgHoonkr&_nc_gid=fca53e0e047a4c5f93d520676b6366b5&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AYB7Jx1JWWnRAzhY4FuHx8q2tnLUVKiIBtPtUJUcjtNJkw&oe=6799BC5B&_nc_sid=8b3546",
              "edge_media_to_tagged_user": {
                "edges": []
              },
              "fact_check_overall_rating": null,
              "fact_check_information": null,
              "gating_info": null,
              "sharing_friction_info": {
                "should_have_sharing_friction": false,
                "bloks_app_url": null
              },
              "media_overlay_info": null,
              "media_preview": "ABgqVIyQDwAemTj/AD0p5iOM5X8x3qO2k8k9WK+mTx3GOQevXnkVdScOeMn8Xz+Hz1OgymYGzzjHfkHqcf1op7TGXJXO1RwCT9eck9+ntRQBUcYFPtCCy4Y5BOfp/Ws2e73javA7mhZyi8Hk9Mds8Giw0zZiwRkdCT/OiqUN6oAQ8epH4UVLTC5jU8dKZThWhIoNFNooEf/Z",
              "owner": {
                "id": "2700692569",
                "username": "adrianhorning"
              },
              "is_video": true,
              "has_upcoming_event": false,
              "accessibility_caption": null,
              "has_audio": true,
              "tracking_token": "eyJ2ZXJzaW9uIjo1LCJwYXlsb2FkIjp7ImlzX2FuYWx5dGljc190cmFja2VkIjp0cnVlLCJ1dWlkIjoiZmNhNTNlMGUwNDdhNGM1ZjkzZDUyMDY3NmI2MzY2YjUzNTQwNjE0MDc1OTU0MzU2MzQ5In0sInNpZ25hdHVyZSI6IiJ9",
              "video_url": "https://scontent-iad3-1.cdninstagram.com/o1/v/t16/f2/m86/AQNnK3RhLzpoAq5frHQ4tr0ukvsmz9S1vMh3hrsKqknkqn_5rSMJJ-G4d3m5qQeXaiijzhoXcTJOsWeicR9U11hqAe2aiGLrVgnsq7w.mp4?stp=dst-mp4&efg=eyJxZV9ncm91cHMiOiJbXCJpZ193ZWJfZGVsaXZlcnlfdnRzX290ZlwiXSIsInZlbmNvZGVfdGFnIjoidnRzX3ZvZF91cmxnZW4uY2xpcHMuYzIuNzIwLmJhc2VsaW5lIn0&_nc_cat=104&vs=1270788217346509_2913271887&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC8xNTQzRTMyRUZFQTAwNDU0NUNFNTkwNThEQzJDM0U4NF92aWRlb19kYXNoaW5pdC5tcDQVAALIAQAVAhg6cGFzc3Rocm91Z2hfZXZlcnN0b3JlL0dGWTFCaHowdGl1RTIyd0ZBQWVEemNJUFpBQlVicV9FQUFBRhUCAsgBACgAGAAbABUAACaagsiP%2BMePQBUCKAJDMywXQFMt41P3ztkYEmRhc2hfYmFzZWxpbmVfMV92MREAdf4HAA%3D%3D&ccb=9-4&oh=00_AYB4gZagLKrlCAo6WLS3oiRVr_p1fsq008W2I7GZ80uL-g&oe=6795C6C3&_nc_sid=8b3546",
              "video_view_count": 1318,
              "edge_media_to_caption": {
                "edges": []
              },
              "edge_media_to_comment": {
                "count": 12
              },
              "comments_disabled": false,
              "taken_at_timestamp": 1736294201,
              "edge_liked_by": {
                "count": 126
              },
              "edge_media_preview_like": {
                "count": 126
              },
              "location": null,
              "nft_asset_info": null,
              "thumbnail_src": "https://scontent-iad3-2.cdninstagram.com/v/t51.2885-15/472965900_18326364268092570_5931185706033057724_n.jpg?stp=c0.437.1125.1125a_dst-jpg_e35_s640x640_sh0.08_tt6&_nc_ht=scontent-iad3-2.cdninstagram.com&_nc_cat=106&_nc_ohc=xKs91h4eoI0Q7kNvgHoonkr&_nc_gid=fca53e0e047a4c5f93d520676b6366b5&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AYDJ48OhYyfP3khEvTSJi109b0RuewgHJS4Oo3BPxdWlgA&oe=6799BC5B&_nc_sid=8b3546",
              "thumbnail_resources": [
                {
                  "src": "https://scontent-iad3-2.cdninstagram.com/v/t51.2885-15/472965900_18326364268092570_5931185706033057724_n.jpg?stp=c0.437.1125.1125a_dst-jpg_e15_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xMTI1eDIwMDAuc2RyLmY3NTc2MS5kZWZhdWx0X2NvdmVyX2ZyYW1lIn0&_nc_ht=scontent-iad3-2.cdninstagram.com&_nc_cat=106&_nc_ohc=xKs91h4eoI0Q7kNvgHoonkr&_nc_gid=fca53e0e047a4c5f93d520676b6366b5&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AYAmEArV6dtea6W4qgKqo_R_YwsnASoiDvNamqdwPEg79w&oe=6799BC5B&_nc_sid=8b3546",
                  "config_width": 150,
                  "config_height": 150
                },
                {
                  "src": "https://scontent-iad3-2.cdninstagram.com/v/t51.2885-15/472965900_18326364268092570_5931185706033057724_n.jpg?stp=c0.437.1125.1125a_dst-jpg_e15_s240x240_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xMTI1eDIwMDAuc2RyLmY3NTc2MS5kZWZhdWx0X2NvdmVyX2ZyYW1lIn0&_nc_ht=scontent-iad3-2.cdninstagram.com&_nc_cat=106&_nc_ohc=xKs91h4eoI0Q7kNvgHoonkr&_nc_gid=fca53e0e047a4c5f93d520676b6366b5&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AYAL85mb-OoBTcFiGndON3_gKESjh028PJ-jUxnzY_2IrQ&oe=6799BC5B&_nc_sid=8b3546",
                  "config_width": 240,
                  "config_height": 240
                },
                {
                  "src": "https://scontent-iad3-2.cdninstagram.com/v/t51.2885-15/472965900_18326364268092570_5931185706033057724_n.jpg?stp=c0.437.1125.1125a_dst-jpg_e15_s320x320_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xMTI1eDIwMDAuc2RyLmY3NTc2MS5kZWZhdWx0X2NvdmVyX2ZyYW1lIn0&_nc_ht=scontent-iad3-2.cdninstagram.com&_nc_cat=106&_nc_ohc=xKs91h4eoI0Q7kNvgHoonkr&_nc_gid=fca53e0e047a4c5f93d520676b6366b5&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AYC_ZgYwvcJ6xwGKMuB3dXGOVLD8avzR5zcmXn5o7Azw9g&oe=6799BC5B&_nc_sid=8b3546",
                  "config_width": 320,
                  "config_height": 320
                },
                {
                  "src": "https://scontent-iad3-2.cdninstagram.com/v/t51.2885-15/472965900_18326364268092570_5931185706033057724_n.jpg?stp=c0.437.1125.1125a_dst-jpg_e15_s480x480_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xMTI1eDIwMDAuc2RyLmY3NTc2MS5kZWZhdWx0X2NvdmVyX2ZyYW1lIn0&_nc_ht=scontent-iad3-2.cdninstagram.com&_nc_cat=106&_nc_ohc=xKs91h4eoI0Q7kNvgHoonkr&_nc_gid=fca53e0e047a4c5f93d520676b6366b5&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AYDh7TJiCa0QZdvSSYiI4u9D_BmydXH1GMG2qnJEfSG21Q&oe=6799BC5B&_nc_sid=8b3546",
                  "config_width": 480,
                  "config_height": 480
                },
                {
                  "src": "https://scontent-iad3-2.cdninstagram.com/v/t51.2885-15/472965900_18326364268092570_5931185706033057724_n.jpg?stp=c0.437.1125.1125a_dst-jpg_e35_s640x640_sh0.08_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xMTI1eDIwMDAuc2RyLmY3NTc2MS5kZWZhdWx0X2NvdmVyX2ZyYW1lIn0&_nc_ht=scontent-iad3-2.cdninstagram.com&_nc_cat=106&_nc_ohc=xKs91h4eoI0Q7kNvgHoonkr&_nc_gid=fca53e0e047a4c5f93d520676b6366b5&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AYDJ48OhYyfP3khEvTSJi109b0RuewgHJS4Oo3BPxdWlgA&oe=6799BC5B&_nc_sid=8b3546",
                  "config_width": 640,
                  "config_height": 640
                }
              ],
              "felix_profile_grid_crop": null,
              "coauthor_producers": [],
              "pinned_for_users": [],
              "viewer_can_reshare": true,
              "like_and_view_counts_disabled": false,
              "product_type": "clips",
              "clips_music_attribution_info": {
                "artist_name": "adrianhorning",
                "song_name": "Original audio",
                "uses_original_audio": true,
                "should_mute_audio": false,
                "should_mute_audio_reason": "",
                "audio_id": "577003721993612"
              }
            }
          }
        ]
      },
      "edge_saved_media": {
        "count": 0,
        "page_info": {
          "has_next_page": false,
          "end_cursor": null
        },
        "edges": []
      },
      "edge_media_collections": {
        "count": 0,
        "page_info": {
          "has_next_page": false,
          "end_cursor": null
        },
        "edges": []
      },
      "edge_related_profiles": {
        "edges": [
          {
            "node": {
              "id": "66873381803",
              "full_name": "ally",
              "is_private": false,
              "is_verified": false,
              "profile_pic_url": "https://scontent-iad3-2.cdninstagram.com/v/t51.2885-19/465249338_1115706923297633_2956285260068952346_n.jpg?stp=dst-jpg_e0_s150x150_tt6&_nc_ht=scontent-iad3-2.cdninstagram.com&_nc_cat=105&_nc_ohc=VDjmLlINuRcQ7kNvgGN3eSS&_nc_gid=fca53e0e047a4c5f93d520676b6366b5&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AYBboj0XGYiNsfaQBDRV0gzqn3m8L8PdwFh18sjOW4XOFg&oe=6799E5F1&_nc_sid=8b3546",
              "username": "itsallykrinsky"
            }
          }
        ]
      }
    }
  },
  "status": "ok"
}
  
  
2、basic profile（基本配置文件，免费）
I want to make an API call to https://api.scrapecreators.com/v1/instagram/basic-profile. 

  Please help me write code to make this API call and handle the response appropriately. Include error handling and best practices.

  Here are the details:
  
  Endpoint: GET https://api.scrapecreators.com/v1/instagram/basic-profile
  
  Description: Get a basic profile by user id. This endpoint is actually free right now also.
  
  Required Headers:
  - x-api-key: Your API key
  
  Parameters:
  - userId : Instagram user id
  
  Example Response:
  {
  "friendship_status": null,
  "gating": null,
  "is_memorialized": false,
  "is_private": false,
  "has_story_archive": null,
  "supervision_info": null,
  "is_regulated_c18": false,
  "regulated_news_in_locations": [],
  "bio_links": [],
  "linked_fb_info": null,
  "text_post_app_badge_label": "zuck",
  "show_text_post_app_badge": true,
  "username": "zuck",
  "text_post_new_post_count": null,
  "pk": "314216",
  "live_broadcast_visibility": null,
  "live_broadcast_id": null,
  "profile_pic_url": "https://instagram.fpoz4-1.fna.fbcdn.net/v/t51.2885-19/550234512_18532404670058217_8758519395071163708_n.jpg?stp=dst-jpg_s150x150_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fpoz4-1.fna.fbcdn.net&_nc_cat=1&_nc_oc=Q6cZ2QENWmroLq0Z2oxDXF-wYN4Txpcg88E2n5GZTMYtQgXKAlUWi1gMsQQilbgL7mYspgA&_nc_ohc=vS_PAWzWFjcQ7kNvwEe9m50&_nc_gid=AOVYXTTsY5VI85UshvRoHA&edm=ALGbJPMBAAAA&ccb=7-5&oh=00_AfcUDbyLkAcHCLaaiVpvfv4AvlKuZUdsos_eZmuWHS02NQ&oe=68EB29FB&_nc_sid=7d3ac5",
  "hd_profile_pic_url_info": {
    "url": "https://instagram.fpoz4-1.fna.fbcdn.net/v/t51.2885-19/550234512_18532404670058217_8758519395071163708_n.jpg?efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4xMDgwLmMyIn0&_nc_ht=instagram.fpoz4-1.fna.fbcdn.net&_nc_cat=1&_nc_oc=Q6cZ2QENWmroLq0Z2oxDXF-wYN4Txpcg88E2n5GZTMYtQgXKAlUWi1gMsQQilbgL7mYspgA&_nc_ohc=vS_PAWzWFjcQ7kNvwEe9m50&_nc_gid=AOVYXTTsY5VI85UshvRoHA&edm=ALGbJPMBAAAA&ccb=7-5&oh=00_AfcBW_k3ngIbA43oUKKZ9SPx-FtlrQSSbOWg8npnXGqCcg&oe=68EB29FB&_nc_sid=7d3ac5"
  },
  "is_unpublished": false,
  "latest_reel_media": 0,
  "has_profile_pic": null,
  "profile_pic_genai_tool_info": [],
  "biography": "I build stuff",
  "full_name": "Mark Zuckerberg",
  "is_verified": true,
  "show_account_transparency_details": true,
  "account_type": 3,
  "follower_count": 16101999,
  "mutual_followers_count": null,
  "profile_context_links_with_user_ids": null,
  "address_street": null,
  "city_name": null,
  "is_business": false,
  "zip": null,
  "biography_with_entities": {
    "entities": []
  },
  "category": null,
  "should_show_category": false,
  "account_badges": [],
  "ai_agent_type": null,
  "external_lynx_url": null,
  "external_url": "",
  "pronouns": [],
  "transparency_label": null,
  "transparency_product": null,
  "has_chaining": null,
  "remove_message_entrypoint": null,
  "fbid_v2": "17841401746480004",
  "is_embeds_disabled": false,
  "is_professional_account": null,
  "following_count": 617,
  "media_count": 409,
  "total_clips_count": 1,
  "latest_besties_reel_media": null,
  "reel_media_seen_timestamp": null,
  "id": "314216"
}
  
  
3、posts（获取公开个人资料的帖子）
I want to make an API call to https://api.scrapecreators.com/v2/instagram/user/posts. 

  Please help me write code to make this API call and handle the response appropriately. Include error handling and best practices.

  Here are the details:
  
  Endpoint: GET https://api.scrapecreators.com/v2/instagram/user/posts
  
  Description: Get a public profile's public posts.
  
  Required Headers:
  - x-api-key: Your API key
  
  Parameters:
  - handle  (Required): Instagram handle
- next_max_id : Cursor to get next page of results.
- trim : Set to true to get a trimmed response
  
  Example Response:
  {
  "profile_grid_items": null,
  "profile_grid_items_cursor": null,
  "pinned_profile_grid_items_ids": null,
  "special_empty_state": null,
  "num_results": 12,
  "more_available": true,
  "items": [
    {
      "pk": "3600545900919030401",
      "id": "3600545900919030401_260462810",
      "fbid": "18362930887133514",
      "device_timestamp": 1743438518281933,
      "caption_is_edited": false,
      "strong_id__": "3600545900919030401_260462810",
      "deleted_reason": 0,
      "has_shared_to_fb": 0,
      "has_delayed_metadata": false,
      "mezql_token": "",
      "share_count_disabled": false,
      "should_request_ads": false,
      "is_reshare_of_text_post_app_media_in_ig": false,
      "integrity_review_decision": "pending",
      "client_cache_key": "MzYwMDU0NTkwMDkxOTAzMDQwMQ==.3",
      "is_visual_reply_commenter_notice_enabled": true,
      "like_and_view_counts_disabled": false,
      "is_post_live_clips_media": false,
      "is_quiet_post": false,
      "profile_grid_thumbnail_fitting_style": "UNSET",
      "comment_threading_enabled": true,
      "is_unified_video": false,
      "commerciality_status": "not_commercial",
      "has_privately_liked": false,
      "filter_type": 0,
      "taken_at": 1743438570,
      "usertags": {
        "in": [
          {
            "position": [
              0,
              0
            ],
            "user": {
              "pk": "212690485",
              "pk_id": "212690485",
              "id": "212690485",
              "username": "danabeers",
              "full_name": "Dana Beers",
              "is_private": false,
              "strong_id__": "212690485",
              "is_verified": false,
              "profile_pic_id": "2989988489592932804_212690485",
              "profile_pic_url": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-19/318474429_599920705227150_928609980618355333_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=H0lCS7PRNvAQ7kNvgFXA75S&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYGujB22ITyWFJ2IJJj0RbJZ4eci7daC1XAPF9PjYiekJg&oe=67F08F1A&_nc_sid=ee9879"
            }
          }
        ]
      },
      "photo_of_you": false,
      "can_see_insights_as_brand": false,
      "media_type": 2,
      "code": "DH3tWudxIKB",
      "caption": {
        "bit_flags": 0,
        "created_at": 1743438572,
        "created_at_utc": 1743438572,
        "did_report_as_spam": false,
        "is_ranked_comment": false,
        "pk": "18362930947133514",
        "share_enabled": false,
        "content_type": "comment",
        "media_id": "3600545900919030401",
        "status": "Active",
        "type": 1,
        "user_id": "260462810",
        "strong_id__": "18362930947133514",
        "text": "Dana is neglecting a pretty important level of the food pyramid @danabeers @francisccellis",
        "user": {
          "pk": "260462810",
          "pk_id": "260462810",
          "id": "260462810",
          "username": "barstoolsports",
          "full_name": "Barstool Sports",
          "is_private": false,
          "is_unpublished": false,
          "strong_id__": "260462810",
          "fbid_v2": "17841401404304069",
          "is_verified": true,
          "profile_pic_id": "2231147078699318026_260462810",
          "profile_pic_url": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-19/84158194_513031692653050_7931868730928136192_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=1&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=cHJtbr8nvvMQ7kNvgG8KI0z&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYE-thied1POUY7OjMrTCxZ_xUJKYVQlZqNm52hKfkoL0w&oe=67F09134&_nc_sid=ee9879"
        },
        "is_covered": false,
        "private_reply_status": 0
      },
      "sharing_friction_info": {
        "bloks_app_url": null,
        "should_have_sharing_friction": false,
        "sharing_friction_payload": null
      },
      "timeline_pinned_user_ids": [],
      "play_count": 35499,
      "has_views_fetching": true,
      "ig_play_count": 35499,
      "creator_viewer_insights": [],
      "display_uri": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-15/487087476_18512111989046811_4084507776030554642_n.jpg?stp=c0.280.720.720a_dst-jpg_e15_tt6&_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=103&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=8g-Cax0RtvwQ7kNvgHeH6jX&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYGqFcLq5SSunfntHrnsPFkav_Suj3uhHLvrGRLxITVeQw&oe=67F08F96&_nc_sid=ee9879",
      "fb_user_tags": {
        "in": []
      },
      "coauthor_producers": [],
      "coauthor_producer_can_see_organic_insights": false,
      "invited_coauthor_producers": [],
      "is_in_profile_grid": false,
      "profile_grid_control_enabled": false,
      "media_cropping_info": {
        "four_by_three_crop": {
          "crop_left": 0,
          "crop_right": 1,
          "crop_top": 0.03597122302158274,
          "crop_bottom": 0.7856115107913669
        }
      },
      "user": {
        "fbid_v2": "17841401404304069",
        "feed_post_reshare_disabled": false,
        "full_name": "Barstool Sports",
        "id": "260462810",
        "is_private": false,
        "is_unpublished": false,
        "pk": "260462810",
        "pk_id": "260462810",
        "show_account_transparency_details": true,
        "strong_id__": "260462810",
        "third_party_downloads_enabled": 1,
        "username": "barstoolsports",
        "account_type": 2,
        "account_badges": [],
        "fan_club_info": {
          "autosave_to_exclusive_highlight": null,
          "connected_member_count": null,
          "fan_club_id": null,
          "fan_club_name": null,
          "has_created_ssc": null,
          "has_enough_subscribers_for_ssc": null,
          "is_fan_club_gifting_eligible": null,
          "is_fan_club_referral_eligible": null,
          "is_free_trial_eligible": null,
          "largest_public_bc_id": null,
          "subscriber_count": null,
          "fan_consideration_page_revamp_eligiblity": null
        },
        "has_anonymous_profile_picture": false,
        "hd_profile_pic_url_info": {
          "height": 347,
          "url": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-19/84158194_513031692653050_7931868730928136192_n.jpg?_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=1&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=cHJtbr8nvvMQ7kNvgG8KI0z&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYGbXeXAZwtXsl3IoEw72PyzVd7YkzEId35UPKfNdoAiOA&oe=67F09134&_nc_sid=ee9879",
          "width": 347
        },
        "hd_profile_pic_versions": [
          {
            "height": 320,
            "url": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-19/84158194_513031692653050_7931868730928136192_n.jpg?stp=dst-jpg_s320x320_tt6&_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=1&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=cHJtbr8nvvMQ7kNvgG8KI0z&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYFEU7S9qsMwzziLrqnusGme7KSs-ji4YcuDMUhqTp-pdQ&oe=67F09134&_nc_sid=ee9879",
            "width": 320
          }
        ],
        "is_verified": true,
        "profile_pic_id": "2231147078699318026_260462810",
        "profile_pic_url": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-19/84158194_513031692653050_7931868730928136192_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=1&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=cHJtbr8nvvMQ7kNvgG8KI0z&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYE-thied1POUY7OjMrTCxZ_xUJKYVQlZqNm52hKfkoL0w&oe=67F09134&_nc_sid=ee9879",
        "transparency_product_enabled": false,
        "is_embeds_disabled": false
      },
      "owner": {
        "fbid_v2": "17841401404304069",
        "feed_post_reshare_disabled": false,
        "full_name": "Barstool Sports",
        "id": "260462810",
        "is_private": false,
        "is_unpublished": false,
        "pk": "260462810",
        "pk_id": "260462810",
        "show_account_transparency_details": true,
        "strong_id__": "260462810",
        "third_party_downloads_enabled": 1,
        "username": "barstoolsports",
        "account_type": 2,
        "can_see_quiet_post_attribution": true,
        "account_badges": [],
        "fan_club_info": {
          "autosave_to_exclusive_highlight": null,
          "connected_member_count": null,
          "fan_club_id": null,
          "fan_club_name": null,
          "has_created_ssc": null,
          "has_enough_subscribers_for_ssc": null,
          "is_fan_club_gifting_eligible": null,
          "is_fan_club_referral_eligible": null,
          "is_free_trial_eligible": null,
          "largest_public_bc_id": null,
          "subscriber_count": null,
          "fan_consideration_page_revamp_eligiblity": null
        },
        "has_anonymous_profile_picture": false,
        "hd_profile_pic_url_info": {
          "height": 347,
          "url": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-19/84158194_513031692653050_7931868730928136192_n.jpg?_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=1&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=cHJtbr8nvvMQ7kNvgG8KI0z&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYGbXeXAZwtXsl3IoEw72PyzVd7YkzEId35UPKfNdoAiOA&oe=67F09134&_nc_sid=ee9879",
          "width": 347
        },
        "hd_profile_pic_versions": [
          {
            "height": 320,
            "url": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-19/84158194_513031692653050_7931868730928136192_n.jpg?stp=dst-jpg_s320x320_tt6&_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=1&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=cHJtbr8nvvMQ7kNvgG8KI0z&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYFEU7S9qsMwzziLrqnusGme7KSs-ji4YcuDMUhqTp-pdQ&oe=67F09134&_nc_sid=ee9879",
            "width": 320
          }
        ],
        "is_verified": true,
        "profile_pic_id": "2231147078699318026_260462810",
        "profile_pic_url": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-19/84158194_513031692653050_7931868730928136192_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=1&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=cHJtbr8nvvMQ7kNvgG8KI0z&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYE-thied1POUY7OjMrTCxZ_xUJKYVQlZqNm52hKfkoL0w&oe=67F09134&_nc_sid=ee9879",
        "transparency_product_enabled": false,
        "is_embeds_disabled": false
      },
      "image_versions2": {
        "candidates": [
          {
            "width": 720,
            "height": 1280,
            "url": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-15/487087476_18512111989046811_4084507776030554642_n.jpg?stp=dst-jpg_e15_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6IkNMSVBTLmltYWdlX3VybGdlbi43MjB4MTI4MC5zZHIuZjc1NzYxLmRlZmF1bHRfY292ZXJfZnJhbWUifQ&_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=103&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=8g-Cax0RtvwQ7kNvgHeH6jX&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&ig_cache_key=MzYwMDU0NTkwMDkxOTAzMDQwMQ%3D%3D.3-ccb7-5&oh=00_AYGBhv1Sb2MbaplLmQqWLMweKKZIHLCNithU6vuu7eTVBw&oe=67F08F96&_nc_sid=ee9879"
          }
        ],
        "additional_candidates": {
          "igtv_first_frame": {
            "width": 640,
            "height": 1136,
            "url": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-15/487676201_1301004624302532_8271586767467241136_n.jpg?stp=dst-jpg_e15_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6IkNMSVBTLmltYWdlX3VybGdlbi42NDB4MTEzNi5zZHIuZjcxODc4LmFkZGl0aW9uYWxfY292ZXJfZnJhbWUifQ&_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=100&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=dSvD25R_BfUQ7kNvgFJ6Gju&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYEs34hm0EA8d6l1it-2L6U5fm9PglrAgGdaDi1ogz81mQ&oe=67F0B285&_nc_sid=ee9879"
          },
          "first_frame": {
            "width": 640,
            "height": 1136,
            "url": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-15/487676201_1301004624302532_8271586767467241136_n.jpg?stp=dst-jpg_e15_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6IkNMSVBTLmltYWdlX3VybGdlbi42NDB4MTEzNi5zZHIuZjcxODc4LmFkZGl0aW9uYWxfY292ZXJfZnJhbWUifQ&_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=100&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=dSvD25R_BfUQ7kNvgFJ6Gju&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYEs34hm0EA8d6l1it-2L6U5fm9PglrAgGdaDi1ogz81mQ&oe=67F0B285&_nc_sid=ee9879"
          },
          "smart_frame": null
        },
        "scrubber_spritesheet_info_candidates": {
          "default": {
            "video_length": 76.717,
            "thumbnail_width": 100,
            "thumbnail_height": 178,
            "thumbnail_duration": 0.7306380952380952,
            "sprite_urls": [
              "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-15/487793384_587822330938532_7049470176872645937_n.jpg?_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=108&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=KnRdrsGznxAQ7kNvgHJi-5x&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYHAIbpqbAmXxvJLmrKjQyqNQAAgZPYgHq8rZBqaTWZmTg&oe=67F0A810&_nc_sid=ee9879"
            ],
            "thumbnails_per_row": 15,
            "total_thumbnail_num_per_sprite": 105,
            "max_thumbnails_per_sprite": 105,
            "sprite_width": 1500,
            "sprite_height": 1246,
            "rendered_width": 96,
            "file_size_kb": 303
          }
        }
      },
      "original_width": 720,
      "original_height": 1280,
      "is_artist_pick": false,
      "media_reposter_bottomsheet_enabled": false,
      "enable_media_notes_production": false,
      "product_type": "clips",
      "is_paid_partnership": false,
      "music_metadata": null,
      "organic_tracking_token": "eyJ2ZXJzaW9uIjo1LCJwYXlsb2FkIjp7ImlzX2FuYWx5dGljc190cmFja2VkIjp0cnVlLCJ1dWlkIjoiOWI2MWIzN2JjYmViNDU2YzlkYjY5NDQzZTJhNTE3MWQzNjAwNTQ1OTAwOTE5MDMwNDAxIn0sInNpZ25hdHVyZSI6IiJ9",
      "is_third_party_downloads_eligible": true,
      "ig_media_sharing_disabled": false,
      "are_remixes_crosspostable": true,
      "boost_unavailable_identifier": null,
      "boost_unavailable_reason": null,
      "boost_unavailable_reason_v2": [],
      "subscribe_cta_visible": false,
      "is_cutout_sticker_allowed": false,
      "cutout_sticker_info": [],
      "gen_ai_detection_method": {
        "detection_method": "NONE"
      },
      "fb_aggregated_like_count": 0,
      "fb_aggregated_comment_count": 0,
      "has_high_risk_gen_ai_inform_treatment": false,
      "open_carousel_show_follow_button": false,
      "is_tagged_media_shared_to_viewer_profile_grid": false,
      "should_show_author_pog_for_tagged_media_shared_to_profile_grid": false,
      "is_eligible_for_media_note_recs_nux": false,
      "is_social_ufi_disabled": false,
      "is_eligible_for_meta_ai_share": true,
      "meta_ai_suggested_prompts": [],
      "can_reply": false,
      "floating_context_items": [],
      "is_eligible_content_for_post_roll_ad": false,
      "is_open_to_public_submission": false,
      "can_view_more_preview_comments": false,
      "preview_comments": [],
      "comment_count": 12,
      "hide_view_all_comment_entrypoint": false,
      "inline_composer_display_condition": "impression_trigger",
      "is_comments_gif_composer_enabled": true,
      "comment_inform_treatment": {
        "action_type": null,
        "should_have_inform_treatment": false,
        "text": "",
        "url": null
      },
      "has_liked": false,
      "like_count": 387,
      "video_sticker_locales": [
        "en",
        "es"
      ],
      "is_dash_eligible": 1,
      "number_of_qualities": 3,
      "video_versions": [
        {
          "bandwidth": null,
          "height": 853,
          "type": 101,
          "url": "https://instagram.fcps3-1.fna.fbcdn.net/o1/v/t16/f2/m86/AQOuysx_TlOyB645kaTBD2015jKy3wl-Ib7HAikfIUB9KF1UD-8levUEpgQYBbWly2Z1XAzM1KTExlC77o9kTz12TJgDfklLEWRzCXI.mp4?stp=dst-mp4&efg=eyJxZV9ncm91cHMiOiJbXCJpZ193ZWJfZGVsaXZlcnlfdnRzX290ZlwiXSIsInZlbmNvZGVfdGFnIjoidnRzX3ZvZF91cmxnZW4uY2xpcHMuYzIuNzIwLmJhc2VsaW5lIn0&_nc_cat=111&vs=1177739773351722_966259887&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC9FNDRCOTJGMEY1OUQzMkNCREE1RTEwNDIzMTBBN0I4RV92aWRlb19kYXNoaW5pdC5tcDQVAALIAQAVAhg6cGFzc3Rocm91Z2hfZXZlcnN0b3JlL0dPWGM5Undqd1BXc3dpVUhBRXNvczdrZkpzTm1icV9FQUFBRhUCAsgBACgAGAAbABUAACbE6eXr6qDMPxUCKAJDMywXQFMnjU%2FfO2QYEmRhc2hfYmFzZWxpbmVfMV92MREAdf4HAA%3D%3D&ccb=9-4&oh=00_AYEvV59EXWzejKnARyETMbkJLSpqYLvyYtjSXydlW1hWvQ&oe=67ECBBBF&_nc_sid=ee9879",
          "width": 480
        }
      ],
      "video_duration": 76.717,
      "has_audio": true,
      "clips_tab_pinned_user_ids": [],
      "clips_metadata": {
        "breaking_content_info": null,
        "breaking_creator_info": null,
        "clips_creation_entry_point": "feed",
        "featured_label": null,
        "is_public_chat_welcome_video": false,
        "is_shared_to_fb": false,
        "professional_clips_upsell_type": 0,
        "reels_on_the_rise_info": null,
        "show_tips": null,
        "achievements_info": {
          "num_earned_achievements": null,
          "show_achievements": false
        },
        "additional_audio_info": {
          "additional_audio_username": null,
          "audio_reattribution_info": {
            "should_allow_restore": false
          }
        },
        "asset_recommendation_info": null,
        "audio_ranking_info": {
          "best_audio_cluster_id": "1023190293029530"
        },
        "audio_type": "original_sounds",
        "branded_content_tag_info": {
          "can_add_tag": false
        },
        "challenge_info": null,
        "content_appreciation_info": {
          "enabled": false,
          "entry_point_container": null
        },
        "contextual_highlight_info": null,
        "cutout_sticker_info": [],
        "disable_use_in_clips_client_cache": false,
        "external_media_info": null,
        "is_fan_club_promo_video": null,
        "merchandising_pill_info": null,
        "music_canonical_id": "18517680835008140",
        "music_info": null,
        "nux_info": null,
        "original_sound_info": {
          "allow_creator_to_rename": true,
          "audio_asset_id": "637972945749202",
          "attributed_custom_audio_asset_id": null,
          "can_remix_be_shared_to_fb": false,
          "can_remix_be_shared_to_fb_expansion": false,
          "duration_in_ms": 76717,
          "formatted_clips_media_count": null,
          "hide_remixing": true,
          "ig_artist": {
            "pk": "260462810",
            "pk_id": "260462810",
            "id": "260462810",
            "username": "barstoolsports",
            "full_name": "Barstool Sports",
            "is_private": false,
            "strong_id__": "260462810",
            "is_verified": true,
            "profile_pic_id": "2231147078699318026_260462810",
            "profile_pic_url": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-19/84158194_513031692653050_7931868730928136192_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=1&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=cHJtbr8nvvMQ7kNvgG8KI0z&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYE-thied1POUY7OjMrTCxZ_xUJKYVQlZqNm52hKfkoL0w&oe=67F09134&_nc_sid=ee9879"
          },
          "is_audio_automatically_attributed": false,
          "is_eligible_for_audio_effects": true,
          "is_eligible_for_vinyl_sticker": true,
          "is_explicit": false,
          "is_original_audio_download_eligible": true,
          "is_reuse_disabled": false,
          "is_xpost_from_fb": false,
          "music_canonical_id": null,
          "oa_owner_is_music_artist": false,
          "original_audio_subtype": "default",
          "original_audio_title": "Original audio",
          "original_media_id": "3600545900919030401",
          "progressive_download_url": "https://video.fcps3-1.fna.fbcdn.net/o1/v/t2/f2/m69/AQOck_jtLI2Ol372qpWxWqY8yn-oUZR1axbswFvc-_cstMG9yp8tDp5pJyoNW1ia8i-fAMQyqi6OdaVzrA7x3p86.mp4?strext=1&_nc_cat=101&_nc_oc=Adm50XCeN7eEPjYmkE2IDnJfgFl2YaCcqzcJ19JQU7wLN28NWL01e0X1epZxVK2R2_aUpb3SkPWVmq0EEQU1Mk0L&_nc_sid=8bf8fe&_nc_ht=video.fcps3-1.fna.fbcdn.net&_nc_ohc=A-9CG2QWVUYQ7kNvgEalDST&efg=eyJ2ZW5jb2RlX3RhZyI6Inhwdl9wcm9ncmVzc2l2ZS5BVURJT19PTkxZLi5DMy4wLnByb2dyZXNzaXZlX2F1ZGlvIiwieHB2X2Fzc2V0X2lkIjo1MTY2NTEyNTEyNjc4NzUsInZpX3VzZWNhc2VfaWQiOjEwMDk5LCJkdXJhdGlvbl9zIjo3NiwidXJsZ2VuX3NvdXJjZSI6Ind3dyJ9&ccb=17-1&_nc_zt=28&oh=00_AYE0CpOUt_o20QYLS7IY6FoAnU4dfvQ7BIeL9Hz_M_GLjg&oe=67F0AC09",
          "should_mute_audio": false,
          "time_created": 1743438574,
          "trend_rank": null,
          "previous_trend_rank": null,
          "overlap_duration_in_ms": null,
          "audio_asset_start_time_in_ms": null,
          "audio_filter_infos": [],
          "audio_parts": [],
          "audio_parts_by_filter": [],
          "consumption_info": {
            "display_media_id": null,
            "is_bookmarked": false,
            "is_trending_in_clips": false,
            "should_mute_audio_reason": "",
            "should_mute_audio_reason_type": null
          },
          "xpost_fb_creator_info": null,
          "fb_downstream_use_xpost_metadata": {
            "downstream_use_xpost_deny_reason": "NONE"
          }
        },
        "originality_info": null,
        "reusable_text_attribute_string": "Dana hasn’t had a vegetable in days",
        "reusable_text_info": [
          {
            "id": "18362930941133514",
            "text": "Dana hasn’t had a vegetable in days",
            "start_time_ms": 0,
            "end_time_ms": 15900,
            "width": 0.9957591178965224,
            "height": 0.13979007633587787,
            "offset_x": 0.49999999999999994,
            "offset_y": 0.5894561214301423,
            "z_index": 0,
            "rotation_degree": 0,
            "scale": 1,
            "alignment": "center",
            "colors": [
              {
                "count": 35,
                "hex_rgba_color": "#ffffffff"
              }
            ],
            "text_format_type": "ig_squeeze",
            "font_size": 37.02390280187842,
            "text_emphasis_mode": "default",
            "is_animated": 0
          }
        ],
        "shopping_info": null,
        "show_achievements": false,
        "template_info": null,
        "viewer_interaction_settings": null
      },
      "clips_text": [],
      "can_viewer_save": true,
      "can_viewer_reshare": true,
      "shop_routing_user_id": null,
      "is_organic_product_tagging_eligible": false,
      "igbio_product": null,
      "product_suggestions": [],
      "commerce_integrity_review_decision": "",
      "is_reuse_allowed": false,
      "has_more_comments": true,
      "max_num_visible_preview_comments": 2,
      "explore_hide_comments": false,
      "url": "https://www.instagram.com/barstoolsports/p/DH3tWudxIKB/"
    }
  ],
  "next_max_id": "3599731065704772932_260462810",
  "user": {
    "pk": "260462810",
    "pk_id": "260462810",
    "username": "barstoolsports",
    "full_name": "Barstool Sports",
    "is_private": false,
    "is_active_on_text_post_app": true,
    "strong_id__": "260462810",
    "profile_grid_display_type": "default",
    "id": "260462810",
    "is_verified": true,
    "profile_pic_id": "2231147078699318026_260462810",
    "profile_pic_url": "https://instagram.fcps3-1.fna.fbcdn.net/v/t51.2885-19/84158194_513031692653050_7931868730928136192_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fcps3-1.fna.fbcdn.net&_nc_cat=1&_nc_oc=Q6cZ2QGkkhOhhuhe2gKjdC25XpoTh0oLgbcvOdFzsOI8KUKAOUyCVoZjtPOQERMK43ysUldXL4DA2XAqd_owFW2XI2pL&_nc_ohc=cHJtbr8nvvMQ7kNvgG8KI0z&_nc_gid=SN-QnazVX0vPrGxNhTJbpA&edm=ACWDqb8BAAAA&ccb=7-5&oh=00_AYE-thied1POUY7OjMrTCxZ_xUJKYVQlZqNm52hKfkoL0w&oe=67F09134&_nc_sid=ee9879"
  },
  "auto_load_more_enabled": false,
  "status": "ok"
}
  
4、post/reel info（获取有关特定帖子的详细信息）
I want to make an API call to https://api.scrapecreators.com/v1/instagram/post. 

  Please help me write code to make this API call and handle the response appropriately. Include error handling and best practices.

  Here are the details:
  
  Endpoint: GET https://api.scrapecreators.com/v1/instagram/post
  
  Description: Get the public detailed information about a specific post or reel
  
  Required Headers:
  - x-api-key: Your API key
  
  Parameters:
  - url  (Required): Instagram post or reel URL
- trim : Set to true to get a trimmed response
  
  Example Response:
  {
  "data": {
    "xdt_shortcode_media": {
      "__typename": "XDTGraphVideo",
      "__isXDTGraphMediaInterface": "XDTGraphVideo",
      "id": "3565077699422862188",
      "shortcode": "DF5s0duxDts",
      "thumbnail_src": "https://scontent-sea1-1.cdninstagram.com/v/t51.2885-15/477122965_649465970874204_1961845900289272695_n.jpg?stp=c0.248.640.640a_dst-jpg_e15_tt6&_nc_ht=scontent-sea1-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2AE17OPWRx7JVrhsmMh75NYbzf6Ab61-ZzNjlOzbTF3BbgU3is19p1nt65t2Jeo-kU0&_nc_ohc=zQmw22ytC2gQ7kNvgFVFX4H&_nc_gid=4cac846734c742a8ad040675e02055a1&edm=ANTKIIoBAAAA&ccb=7-5&oh=00_AYDjwvXDRPcIn3XKsgrcRgXX-k4eeAAbk1_3QF4pnq5kBw&oe=67B1F4C6&_nc_sid=d885a2",
      "dimensions": {
        "height": 1136,
        "width": 640
      },
      "gating_info": null,
      "fact_check_overall_rating": null,
      "fact_check_information": null,
      "sensitivity_friction_info": null,
      "sharing_friction_info": {
        "should_have_sharing_friction": false,
        "bloks_app_url": null
      },
      "media_overlay_info": null,
      "media_preview": "ABgqlppqxtFVpzhse1QUNJoqPNFAE4uyx4Xr3zTXckYx9easLaKnTP8A+ustt4OMfN0J9f8APp2oaGiZZlJxgg0VUZJISC6kAck//X6UUAdD3zTDCrHd+OKenQf59acOg/CtLEXFOO9FIaKYH//Z",
      "display_url": "https://scontent-sea1-1.cdninstagram.com/v/t51.2885-15/477122965_649465970874204_1961845900289272695_n.jpg?stp=dst-jpg_e15_tt6&_nc_ht=scontent-sea1-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2AE17OPWRx7JVrhsmMh75NYbzf6Ab61-ZzNjlOzbTF3BbgU3is19p1nt65t2Jeo-kU0&_nc_ohc=zQmw22ytC2gQ7kNvgFVFX4H&_nc_gid=4cac846734c742a8ad040675e02055a1&edm=ANTKIIoBAAAA&ccb=7-5&oh=00_AYAxoU1w8axVPKICMRqdMtj8Taft6eMMJcRz32omIjVxDA&oe=67B1F4C6&_nc_sid=d885a2",
      "display_resources": [
        {
          "src": "https://scontent-sea1-1.cdninstagram.com/v/t51.2885-15/477122965_649465970874204_1961845900289272695_n.jpg?stp=dst-jpg_e15_tt6&_nc_ht=scontent-sea1-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2AE17OPWRx7JVrhsmMh75NYbzf6Ab61-ZzNjlOzbTF3BbgU3is19p1nt65t2Jeo-kU0&_nc_ohc=zQmw22ytC2gQ7kNvgFVFX4H&_nc_gid=4cac846734c742a8ad040675e02055a1&edm=ANTKIIoBAAAA&ccb=7-5&oh=00_AYAxoU1w8axVPKICMRqdMtj8Taft6eMMJcRz32omIjVxDA&oe=67B1F4C6&_nc_sid=d885a2",
          "config_width": 640,
          "config_height": 1136
        },
        {
          "src": "https://scontent-sea1-1.cdninstagram.com/v/t51.2885-15/477122965_649465970874204_1961845900289272695_n.jpg?stp=dst-jpg_e15_tt6&_nc_ht=scontent-sea1-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2AE17OPWRx7JVrhsmMh75NYbzf6Ab61-ZzNjlOzbTF3BbgU3is19p1nt65t2Jeo-kU0&_nc_ohc=zQmw22ytC2gQ7kNvgFVFX4H&_nc_gid=4cac846734c742a8ad040675e02055a1&edm=ANTKIIoBAAAA&ccb=7-5&oh=00_AYAxoU1w8axVPKICMRqdMtj8Taft6eMMJcRz32omIjVxDA&oe=67B1F4C6&_nc_sid=d885a2",
          "config_width": 750,
          "config_height": 1331
        },
        {
          "src": "https://scontent-sea1-1.cdninstagram.com/v/t51.2885-15/477122965_649465970874204_1961845900289272695_n.jpg?stp=dst-jpg_e15_tt6&_nc_ht=scontent-sea1-1.cdninstagram.com&_nc_cat=100&_nc_oc=Q6cZ2AE17OPWRx7JVrhsmMh75NYbzf6Ab61-ZzNjlOzbTF3BbgU3is19p1nt65t2Jeo-kU0&_nc_ohc=zQmw22ytC2gQ7kNvgFVFX4H&_nc_gid=4cac846734c742a8ad040675e02055a1&edm=ANTKIIoBAAAA&ccb=7-5&oh=00_AYAxoU1w8axVPKICMRqdMtj8Taft6eMMJcRz32omIjVxDA&oe=67B1F4C6&_nc_sid=d885a2",
          "config_width": 1080,
          "config_height": 1917
        }
      ],
      "accessibility_caption": null,
      "has_audio": true,
      "video_url": "https://scontent-sea1-1.cdninstagram.com/o1/v/t16/f2/m86/AQP4IJauokcKbsjCuiS19oS9j8TnwkIWzB7RHC-iVt_BNYllkpvxQEiX4tIzXprdJEJ2ML_jx2fLMQUMP_0RmoUFwg7DEtCgRXpVRTo.mp4?stp=dst-mp4&efg=eyJxZV9ncm91cHMiOiJbXCJpZ193ZWJfZGVsaXZlcnlfdnRzX290ZlwiXSIsInZlbmNvZGVfdGFnIjoidnRzX3ZvZF91cmxnZW4uY2xpcHMuYzIuNzIwLmJhc2VsaW5lIn0&_nc_cat=104&vs=593530940236492_4206875558&_nc_vs=HBksFQIYUmlnX3hwdl9yZWVsc19wZXJtYW5lbnRfc3JfcHJvZC9BMjRBOUFBQzE4RURCODhFNURFREQ3ODJGRkQ5RkJBMF92aWRlb19kYXNoaW5pdC5tcDQVAALIAQAVAhg6cGFzc3Rocm91Z2hfZXZlcnN0b3JlL0dPcTFaaHlFdlhmLTF2RUdBTnRNT0Z5Q2lOcGFicV9FQUFBRhUCAsgBACgAGAAbABUAACa6kM3OoZ2SQBUCKAJDMywXQFHGZmZmZmYYEmRhc2hfYmFzZWxpbmVfMV92MREAdf4HAA%3D%3D&_nc_rid=4cac869512&ccb=9-4&oh=00_AYCLLihbo33jZKbkdW5YjTS9E66e3A8Kbh6AZt9cyWANOA&oe=67ADEC40&_nc_sid=d885a2",
      "video_view_count": 1639,
      "video_play_count": 4651,
      "encoding_status": null,
      "is_published": true,
      "product_type": "clips",
      "title": "",
      "video_duration": 71.1,
      "clips_music_attribution_info": {
        "artist_name": "adrianhorning",
        "song_name": "Original audio",
        "uses_original_audio": true,
        "should_mute_audio": false,
        "should_mute_audio_reason": "",
        "audio_id": "1306404793971715"
      },
      "is_video": true,
      "tracking_token": "eyJ2ZXJzaW9uIjo1LCJwYXlsb2FkIjp7ImlzX2FuYWx5dGljc190cmFja2VkIjp0cnVlLCJ1dWlkIjoiNGNhYzg0NjczNGM3NDJhOGFkMDQwNjc1ZTAyMDU1YTEzNTY1MDc3Njk5NDIyODYyMTg4In0sInNpZ25hdHVyZSI6IiJ9",
      "upcoming_event": null,
      "edge_media_to_tagged_user": {
        "edges": []
      },
      "owner": {
        "id": "2700692569",
        "username": "adrianhorning",
        "is_verified": true,
        "profile_pic_url": "https://scontent-sea1-1.cdninstagram.com/v/t51.2885-19/430086429_362220943449758_2621012714660517106_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=scontent-sea1-1.cdninstagram.com&_nc_cat=102&_nc_oc=Q6cZ2AE17OPWRx7JVrhsmMh75NYbzf6Ab61-ZzNjlOzbTF3BbgU3is19p1nt65t2Jeo-kU0&_nc_ohc=rycDB4oz6_gQ7kNvgEuoNwO&_nc_gid=4cac846734c742a8ad040675e02055a1&edm=ANTKIIoBAAAA&ccb=7-5&oh=00_AYBNWww8LoZAjXN2kKo1QVhjSx_TT5XbWO16jfRg-oV66w&oe=67B1F1A9&_nc_sid=d885a2",
        "blocked_by_viewer": false,
        "restricted_by_viewer": null,
        "followed_by_viewer": false,
        "full_name": "Adrian Horning",
        "has_blocked_viewer": false,
        "is_embeds_disabled": false,
        "is_private": false,
        "is_unpublished": false,
        "requested_by_viewer": false,
        "pass_tiering_recommendation": true,
        "edge_owner_to_timeline_media": {
          "count": 72
        },
        "edge_followed_by": {
          "count": 25139
        }
      },
      "edge_media_to_caption": {
        "edges": [
          {
            "node": {
              "created_at": "1739210436",
              "text": "I built my own gumroad in 24 hours with AI",
              "id": "17957841497904836"
            }
          }
        ]
      },
      "can_see_insights_as_brand": false,
      "caption_is_edited": false,
      "has_ranked_comments": false,
      "like_and_view_counts_disabled": false,
      "edge_media_to_parent_comment": {
        "count": 17,
        "page_info": {
          "has_next_page": true,
          "end_cursor": "{\"server_cursor\": \"QVFDV1ZtblRoZkNkdnhsdEZTVnhoajJfbXNnYXMwTV9SNHBOQVRrczJsUkVYNUJfa25IdUZmdmo1a0JKYklBYUR3ZEpsXzdfY2ZiUmhJeUliMDlvazVOWg==\", \"is_server_cursor_inverse\": true}"
        },
        "edges": [
          {
            "node": {
              "id": "18063179545902021",
              "text": "🔥",
              "created_at": 1739307412,
              "did_report_as_spam": false,
              "owner": {
                "id": "61973745595",
                "is_verified": false,
                "profile_pic_url": "https://scontent-sea1-1.cdninstagram.com/v/t51.2885-19/474798440_440451159035533_6502503228258065643_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=scontent-sea1-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2AE17OPWRx7JVrhsmMh75NYbzf6Ab61-ZzNjlOzbTF3BbgU3is19p1nt65t2Jeo-kU0&_nc_ohc=XEL7IswpkQcQ7kNvgEZ07XQ&_nc_gid=4cac846734c742a8ad040675e02055a1&edm=ANTKIIoBAAAA&ccb=7-5&oh=00_AYBT8mlDM3cocpUMctldRdgDkZ6R_0_29V4YPWFpWP_XTA&oe=67B1F48C&_nc_sid=d885a2",
                "username": "helioslabsofficial"
              },
              "viewer_has_liked": false,
              "edge_liked_by": {
                "count": 1
              },
              "is_restricted_pending": false,
              "edge_threaded_comments": {
                "count": 0,
                "page_info": {
                  "has_next_page": false,
                  "end_cursor": null
                },
                "edges": []
              }
            }
          }
        ]
      },
      "edge_media_to_hoisted_comment": {
        "edges": []
      },
      "edge_media_preview_comment": {
        "count": 17,
        "edges": [
          {
            "node": {
              "id": "18063179545902021",
              "text": "🔥",
              "created_at": 1739307412,
              "did_report_as_spam": false,
              "owner": {
                "id": "61973745595",
                "is_verified": false,
                "profile_pic_url": "https://scontent-sea1-1.cdninstagram.com/v/t51.2885-19/474798440_440451159035533_6502503228258065643_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=scontent-sea1-1.cdninstagram.com&_nc_cat=101&_nc_oc=Q6cZ2AE17OPWRx7JVrhsmMh75NYbzf6Ab61-ZzNjlOzbTF3BbgU3is19p1nt65t2Jeo-kU0&_nc_ohc=XEL7IswpkQcQ7kNvgEZ07XQ&_nc_gid=4cac846734c742a8ad040675e02055a1&edm=ANTKIIoBAAAA&ccb=7-5&oh=00_AYBT8mlDM3cocpUMctldRdgDkZ6R_0_29V4YPWFpWP_XTA&oe=67B1F48C&_nc_sid=d885a2",
                "username": "helioslabsofficial"
              },
              "viewer_has_liked": false,
              "edge_liked_by": {
                "count": 1
              },
              "is_restricted_pending": false
            }
          }
        ]
      },
      "comments_disabled": false,
      "commenting_disabled_for_viewer": false,
      "taken_at_timestamp": 1739210435,
      "edge_media_preview_like": {
        "count": 153,
        "edges": []
      },
      "edge_media_to_sponsor_user": {
        "edges": []
      },
      "is_affiliate": false,
      "is_paid_partnership": false,
      "location": null,
      "nft_asset_info": null,
      "viewer_has_liked": false,
      "viewer_has_saved": false,
      "viewer_has_saved_to_collection": false,
      "viewer_in_photo_of_you": false,
      "viewer_can_reshare": true,
      "is_ad": false,
      "edge_web_media_to_related_media": {
        "edges": []
      },
      "coauthor_producers": [],
      "pinned_for_users": []
    }
  },
  "extensions": {
    "is_final": true
  },
  "status": "ok"
}
  
  
