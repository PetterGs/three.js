export default /* glsl */`
#ifdef USE_AOMAP

	// reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
	float ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;

	reflectedLight.indirectDiffuse *= ambientOcclusion;

	#if defined( USE_BENTNORMALMAP ) && defined( RE_Direct )

	reflectedLight.directDiffuse *= ambientOcclusion;

	#endif

	#if defined( USE_ENVMAP ) && defined( STANDARD )

		float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );

		#ifdef USE_BENTNORMALMAP

			//float occlusionFactor = ( material.specularRoughness - 1.0 ) * bouncedRadianceFactor + 1.0;

			//occlusionFactor = ( occlusionFactor - 1.0 ) * metalnessFactor + 1.0;

			//ambientOcclusion = ( ambientOcclusion - 1.0 ) * occlusionFactor + 1.0;

			// "Simplified"
			ambientOcclusion = ambientOcclusion * material.specularRoughness * bouncedRadianceFactor  * metalnessFactor + bouncedRadianceFactor * metalnessFactor - ambientOcclusion * bouncedRadianceFactor * metalnessFactor - material.specularRoughness * bouncedRadianceFactor * metalnessFactor + ambientOcclusion;
		
		#endif

		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );

	#endif

#endif
`;
