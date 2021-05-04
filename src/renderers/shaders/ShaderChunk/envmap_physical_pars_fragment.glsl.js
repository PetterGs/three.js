export default /* glsl */`
#if defined( USE_ENVMAP )

	#ifdef ENVMAP_MODE_REFRACTION
		uniform float refractionRatio;
	#endif

	vec3 getLightProbeIndirectIrradiance( /*const in SpecularLightProbe specularLightProbe,*/ const in GeometricContext geometry, const in int maxMIPLevel ) {

		#if defined( USE_BENTNORMALMAP )
		
			vec3 worldNormal = inverseTransformDirection( geometry.bentNormal, viewMatrix );
		
		#else
		
			vec3 worldNormal = inverseTransformDirection( geometry.normal, viewMatrix );
		
		#endif

		#ifdef ENVMAP_TYPE_CUBE

			vec3 queryVec = vec3( flipEnvMap * worldNormal.x, worldNormal.yz );

			// TODO: replace with properly filtered cubemaps and access the irradiance LOD level, be it the last LOD level
			// of a specular cubemap, or just the default level of a specially created irradiance cubemap.

			#ifdef TEXTURE_LOD_EXT

				vec4 envMapColor = textureCubeLodEXT( envMap, queryVec, float( maxMIPLevel ) );

			#else

				// force the bias high to get the last LOD level as it is the most blurred.
				vec4 envMapColor = textureCube( envMap, queryVec, float( maxMIPLevel ) );

			#endif

			envMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;

		#elif defined( ENVMAP_TYPE_CUBE_UV )

			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );

		#else

			vec4 envMapColor = vec4( 0.0 );

		#endif

		return PI * envMapColor.rgb * envMapIntensity;

	}

	// Trowbridge-Reitz distribution to Mip level, following the logic of http://casual-effects.blogspot.ca/2011/08/plausible-environment-lighting-in-two.html
	float getSpecularMIPLevel( const in float roughness, const in int maxMIPLevel ) {

		float maxMIPLevelScalar = float( maxMIPLevel );

		float sigma = PI * roughness * roughness / ( 1.0 + roughness );
		float desiredMIPLevel = maxMIPLevelScalar + log2( sigma );

		// clamp to allowable LOD ranges.
		return clamp( desiredMIPLevel, 0.0, maxMIPLevelScalar );

	}
	
	#ifdef USE_BENTNORMALMAP

		vec3 getLightProbeIndirectRadiance( /*const in SpecularLightProbe specularLightProbe,*/ const in vec3 viewDir, const in vec3 normal, const in vec3 bentNormal, const in float roughness, const in int maxMIPLevel, const in vec3 diffuseColor ) {
			
	#else 

		vec3 getLightProbeIndirectRadiance( /*const in SpecularLightProbe specularLightProbe,*/ const in vec3 viewDir, const in vec3 normal, const in float roughness, const in int maxMIPLevel ) {

	#endif
	
		#ifdef ENVMAP_MODE_REFLECTION

			// Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			
		#else

			reflectVec = refract( -viewDir, normal, refractionRatio );
			
		#endif

		reflectVec = inverseTransformDirection( reflectVec, viewMatrix );

		#ifdef USE_BENTNORMALMAP

			bentReflectVec = inverseTransformDirection( bentReflectVec, viewMatrix );

		#endif

		float specularMIPLevel = getSpecularMIPLevel( roughness, maxMIPLevel );

		#ifdef USE_BENTNORMALMAP

			float bouncedMIPLevel = getSpecularMIPLevel(roughness * bounceBlurMultiplier, maxMIPLevel );

		#endif

		#ifdef ENVMAP_TYPE_CUBE

			vec3 queryReflectVec = vec3( flipEnvMap * reflectVec.x, reflectVec.yz );

			#ifdef USE_BENTNORMALMAP

				vec3 queryBounceVec = vec3( flipEnvMap * bentReflectVec.x, bentReflectVec.yz );

			#endif

			#ifdef TEXTURE_LOD_EXT

				vec4 envMapColor = textureCubeLodEXT( envMap, queryReflectVec, specularMIPLevel );

				#ifdef USE_BENTNORMALMAP

				vec4 envBounceColor = textureCubeLodEXT( envMap, queryBounceVec, bouncedMIPLevel );

				#endif

			#else

				vec4 envMapColor = textureCube( envMap, queryReflectVec, specularMIPLevel );

				#ifdef USE_BENTNORMALMAP

					vec4 envBounceColor = textureCube( envMap, queryBounceVec, bouncedMIPLevel  );
				
				#endif

			#endif

			envMapColor.rgb = envMapTexelToLinear( envMapColor ).rgb;

			#ifdef USE_BENTNORMALMAP

				envBounceColor.rgb = envMapTexelToLinear( envBounceColor ).rgb;
				
			#endif

		#elif defined( ENVMAP_TYPE_CUBE_UV )

			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );

			#ifdef USE_BENTNORMALMAP

				vec4 envBounceColor = textureCubeUV( envMap, bentReflectVec, roughness * bounceBlurMultiplier );
				
			#endif

		#endif

		#ifdef USE_BENTNORMALMAP

			vec3 selfBounceColor = diffuseColor * bouncePowerMultiplier;
			return mix( envMapColor.rgb, envBounceColor.rgb * selfBounceColor, bouncedRadianceFactor ) * envMapIntensity;

		#else
		
			return envMapColor.rgb * envMapIntensity;

		#endif

	}

#endif
`;
