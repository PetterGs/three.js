export default /* glsl */`

#ifdef USE_BENTNORMALMAP

	vec3 mapBN = texture2D( bentNormalMap, vUv2 ).xyz * 2.0 - 1.0;
	
	#ifdef USE_TANGENT

		bentNormal = normalize( vTBN * mapBN );

	#else

		bentNormal = perturbNormal2Arb( -vViewPosition, normal, mapBN, faceDirection );
	
	#endif

#endif

#ifdef OBJECTSPACE_NORMALMAP

	normal = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

	#ifdef FLIP_SIDED

		normal = - normal;

	#endif

	#ifdef DOUBLE_SIDED

		normal = normal * faceDirection;

	#endif

	normal = normalize( normalMatrix * normal );

#elif defined( TANGENTSPACE_NORMALMAP )

	vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;

	#ifdef USE_TANGENT

		normal = normalize( vTBN * mapN );

	#else

		normal = perturbNormal2Arb( -vViewPosition, normal, mapN, faceDirection );

	#endif

#elif defined( USE_BUMPMAP )

	normal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd(), faceDirection );

#endif
`;
